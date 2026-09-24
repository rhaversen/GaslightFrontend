'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, type ReactElement } from 'react'

import { viewApi, type CollectionName, type LensPivot, type ViewResponse, type ViewRow } from '@/api'

// The explore canvas. Three zones:
//   rail  — the four collections, always visible, client-side searchable
//   main  — browse (no focus) or a focused document's lens view
//   rows  — every row is a pivot; chips are rendered from lens metadata
// The URL (?focus=game/<id>&lens=tournaments) is the entire state.

const COLLECTIONS: Array<{ id: CollectionName, label: string }> = [
	{ id: 'game', label: 'Games' },
	{ id: 'user', label: 'Users' },
	{ id: 'tournament', label: 'Tournaments' },
	{ id: 'strategy', label: 'Strategies' }
]

type Focus = { collection: CollectionName, id: string } | null

/** Navigation context passed down: where rows may lead. */
interface Nav {
	focus: Focus
	/** Collection the currently rendered rows belong to (lens.onto) */
	onto: CollectionName | 'row'
	onNavigate: (next: { focus?: Focus, lens?: string | null }) => void
}

function parseFocus (raw: string | null): Focus {
	if (raw === null) { return null }
	const slashIndex = raw.indexOf('/')
	if (slashIndex < 0) { return null }
	const collection = raw.slice(0, slashIndex)
	const id = raw.slice(slashIndex + 1)
	if (!['user', 'game', 'tournament', 'strategy'].includes(collection) || id.length === 0) { return null }
	return { collection: collection as CollectionName, id }
}

function formatDate (date: string | undefined): string {
	if (date === undefined) { return '' }
	return new Date(date).toLocaleDateString()
}

function fieldLabel (field: string): string {
	const labels: Record<string, string> = {
		players: 'players',
		strategyCount: 'strategies',
		tournaments: 'tournaments',
		bestPlacement: 'best',
		placement: '#',
		score: 'score',
		percentileRank: 'pct',
		tokenCount: 'tokens',
		participants: 'players',
		gamesPlayed: 'games',
		active: 'active'
	}
	return labels[field] ?? field
}

function formatStat (value: unknown): string {
	if (value === undefined || value === null) { return '—' }
	if (typeof value === 'boolean') { return value ? 'yes' : 'no' }
	if (typeof value === 'number') { return Number.isInteger(value) ? String(value) : value.toFixed(1) }
	return String(value)
}

export default function ExplorePage (): ReactElement {
	return (
		<Suspense fallback={<div className="min-h-screen" />}>
			<ExploreCanvas />
		</Suspense>
	)
}

function ExploreCanvas (): ReactElement {
	const searchParams = useSearchParams()
	const router = useRouter()
	const focus = parseFocus(searchParams.get('focus'))
	const lens = searchParams.get('lens')
	const sort = searchParams.get('sort')
	const rival = searchParams.get('rival')
	const windowId = (searchParams.get('window') ?? 'all') as WindowId

	const onNavigate = (next: { focus?: Focus, lens?: string | null, sort?: string | null, window?: string | null, rival?: string | null }): void => {
		const params = new URLSearchParams()
		const nextFocus = next.focus !== undefined ? next.focus : focus
		if (nextFocus !== null) {
			params.set('focus', `${nextFocus.collection}/${nextFocus.id}`)
		}
		const nextLens = next.lens !== undefined ? next.lens : lens
		if (nextFocus !== null && nextLens !== null && nextLens.length > 0) {
			params.set('lens', nextLens)
		}
		const nextSort = next.sort !== undefined ? next.sort : sort
		if (nextSort !== null && nextSort.length > 0) {
			params.set('sort', nextSort)
		}
		const nextWindow = next.window !== undefined ? next.window : windowId
		if (nextWindow !== 'all') {
			params.set('window', String(nextWindow))
		}
		const nextRival = next.rival !== undefined ? next.rival : rival
		if (nextRival !== null && nextRival.length > 0) {
			params.set('rival', nextRival)
		}
		const query = params.toString()
		router.push(query.length > 0 ? `/explore?${query}` : '/explore')
	}

	const windowRange = windowRangeFrom(windowId)
	const activeCollection: CollectionName = focus?.collection ?? 'game'

	return (
		<main className="flex min-h-screen">
			<Rail activeCollection={activeCollection} focus={focus} onNavigate={onNavigate} />
			<section className="flex-1 min-w-0 p-4 sm:p-6">
				{focus === null
					? (
						<CollectionView collection={activeCollection} sort={sort} windowRange={windowRange} onNavigate={onNavigate} />
					)
					: (
						<FocusView
							focus={focus}
							requestedLens={lens}
							windowRange={windowRange}
							windowId={windowId}
							rival={rival}
							onNavigate={onNavigate}
						/>
					)}
			</section>
		</main>
	)
}

const WINDOWS: Array<{ id: WindowId, label: string, days: number | null }> = [
	{ id: '30d', label: '30d', days: 30 },
	{ id: '90d', label: '90d', days: 90 },
	{ id: '1y', label: '1y', days: 365 },
	{ id: 'all', label: 'All', days: null }
]

type WindowId = '30d' | '90d' | '1y' | 'all'

function windowRangeFrom (id: WindowId): { from?: Date, to?: Date } {
	const preset = WINDOWS.find(w => w.id === id)
	if (preset === undefined || preset.days === null) { return {} }
	const to = new Date()
	return { from: new Date(to.getTime() - preset.days * 86_400_000), to }
}

/* ---------------------------------- rail --------------------------------- */

function Rail ({ activeCollection, focus, onNavigate }: {
	activeCollection: CollectionName
	focus: Focus
	onNavigate: (next: { focus?: Focus, lens?: string | null, sort?: string | null, window?: string | null }) => void
}): ReactElement {
	// Server-backed search (q param) — the collections can be far larger than
	// any client-side filter can handle.
	const [query, setQuery] = useState('')
	const [debounced, setDebounced] = useState('')
	useEffect(() => {
		const t = setTimeout(() => { setDebounced(query.trim()) }, 250)
		return () => { clearTimeout(t) }
	}, [query])

	return (
		<nav className="w-52 sm:w-60 flex-shrink-0 border-r border-border bg-surface/40 min-h-screen p-3 space-y-3 sticky top-0 self-start">
			<input
				type="search"
				value={query}
				onChange={(e) => { setQuery(e.target.value) }}
				placeholder="Search…"
				className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			/>
			{COLLECTIONS.map(collection => (
				<RailCollection
					key={collection.id}
					collection={collection}
					active={collection.id === activeCollection}
					focus={focus}
					query={debounced}
					onNavigate={onNavigate}
				/>
			))}
			<p className="text-[11px] text-subtle leading-relaxed px-1">
				{'Click a name to focus it. Chips on rows jump across collections.'}
			</p>
		</nav>
	)
}

function RailCollection ({ collection, active, focus, query, onNavigate }: {
	collection: { id: CollectionName, label: string }
	active: boolean
	focus: Focus
	query: string
	onNavigate: (next: { focus?: Focus, lens?: string | null, sort?: string | null, window?: string | null }) => void
}): ReactElement {
	// Collapsed unless it holds the focus or the query is hunting in it —
	// four expanded lists of 1000 items each is the clutter we are avoiding.
	const expanded = active || query.length > 0
	const { data, isLoading } = useQuery({
		queryKey: ['view', collection.id, 'rail', query],
		queryFn: () => viewApi.collection(collection.id, { lens: 'browse', limit: 12, q: query.length > 0 ? query : undefined }),
		staleTime: 60_000
	})

	const rows = data?.rows ?? []
	const total = data?.total ?? 0

	return (
		<div>
			<button
				type="button"
				onClick={() => { onNavigate({ focus: null, lens: null }) }}
				className={`w-full flex items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
					active ? 'text-accent' : 'text-muted hover:text-foreground'
					}`}
			>
				<span>{collection.label}</span>
				<span className="text-[10px] normal-case text-subtle">{total > 0 ? total : ''}</span>
			</button>
			{expanded && (
				isLoading
					? (
						<div className="space-y-1 px-1">
							{[0, 1, 2].map(i => <div key={i} className="h-5 rounded bg-surface-2 animate-pulse" />)}
						</div>
					)
					: (
						<ul className="space-y-0.5">
							{rows.map(row => {
								const isFocused = focus !== null && focus.collection === collection.id && focus.id === row.id
								return (
									<li key={row.id}>
										<button
											type="button"
											onClick={() => { onNavigate({ focus: { collection: collection.id, id: row.id ?? '' }, lens: null }) }}
											className={`w-full text-left px-2 py-1 rounded-md text-sm truncate transition-colors ${
												isFocused
													? 'bg-accent-soft text-foreground'
													: 'text-muted hover:text-foreground hover:bg-surface-2'
												}`}
										>
											{row.label ?? row.id}
										</button>
									</li>
								)
							})}
							{rows.length === 0 && <li className="px-2 py-1 text-xs text-subtle">{'No matches'}</li>}
							{!isLoading && total > rows.length && (
								<li className="px-2 py-1 text-[11px] text-subtle">
									{`Showing ${rows.length} of ${total} — refine the search`}
								</li>
							)}
						</ul>
					)
			)}
		</div>
	)
}

/* ------------------------------ collection ------------------------------- */

function CollectionView ({ collection, sort, windowRange, onNavigate }: {
	collection: CollectionName
	sort: string | null
	windowRange: { from?: Date, to?: Date }
	onNavigate: (next: { focus?: Focus, lens?: string | null, sort?: string | null, window?: string | null }) => void
}): ReactElement {
	const { data, isLoading, isError, error, refetch } = useQuery({
		queryKey: ['view', collection, 'browse', 'main', sort, windowRange.from?.toISOString() ?? ''],
		queryFn: () => viewApi.collection(collection, {
			lens: 'browse',
			limit: 50,
			sort: sort ?? undefined,
			from: windowRange.from?.toISOString(),
			to: windowRange.to?.toISOString()
		})
	})

	const meta = COLLECTIONS.find(c => c.id === collection)
	const hasMetrics = data !== undefined && data.rows.some(r =>
		['strategyCount', 'tournaments', 'gamesPlayed'].some(k => typeof r[k] === 'number'))

	return (
		<div>
			<Header
				title={meta?.label ?? collection}
				subtitle={data !== undefined ? `${data.total} total` : undefined}
				sort={hasMetrics ? sort : null}
				onSort={(metric) => { onNavigate({ sort: metric === (sort ?? '') ? null : metric }) }}
				windowId={null}
				onWindow={() => {}}
			/>
			<Body
				data={data}
				isLoading={isLoading}
				isError={isError}
				error={error}
				retry={() => { void refetch() }}
				onto={data?.lens.onto ?? 'row'}
				onNavigate={onNavigate}
			/>
		</div>
	)
}

/* -------------------------------- focus ---------------------------------- */

function FocusView ({ focus, requestedLens, windowRange, windowId, rival, onNavigate }: {
	focus: NonNullable<Focus>
	requestedLens: string | null
	windowRange: { from?: Date, to?: Date }
	windowId: WindowId
	rival: string | null
	onNavigate: (next: { focus?: Focus, lens?: string | null, sort?: string | null, window?: string | null, rival?: string | null }) => void
}): ReactElement {
	// Lens metadata only — no pipeline execution, no wasted queries.
	const meta = useQuery({
		queryKey: ['view', focus.collection, 'meta'],
		queryFn: () => viewApi.meta(focus.collection),
		staleTime: 300_000
	})
	// Only lenses that accept an anchor document are usable here.
	const documentLenses = (meta.data?.lenses ?? []).filter(l => l.scopes !== 'collection')
	const activeLens = requestedLens !== null && documentLenses.some(l => l.id === requestedLens)
		? requestedLens
		: documentLenses[0]?.id

	const view = useQuery({
		queryKey: ['view', focus.collection, focus.id, activeLens, windowRange.from?.toISOString() ?? '', rival ?? ''],
		queryFn: () => viewApi.document(focus.collection, focus.id, {
			lens: activeLens ?? 'browse',
			limit: 50,
			me: rival ?? undefined,
			from: windowRange.from?.toISOString(),
			to: windowRange.to?.toISOString()
		}),
		enabled: activeLens !== undefined
	})

	// Rivals feed the head-to-head rival picker
	const rivalsQuery = useQuery({
		queryKey: ['view', focus.collection, focus.id, 'rivals'],
		queryFn: () => viewApi.document(focus.collection, focus.id, { lens: 'rivals', limit: 20 }),
		enabled: focus.collection === 'user' && activeLens === 'head-to-head'
	})

	return (
		<div>
			<FocusHeader focus={focus} onNavigate={onNavigate} fallbackLabel={view.data?.focus?.label} fallbackSubtitle={view.data?.focus?.subtitle} />
			{documentLenses.length > 1 && (
				<div className="flex flex-wrap gap-1.5 mb-3">
					{documentLenses.map(available => (
						<button
							key={available.id}
							type="button"
							title={available.description}
							onClick={() => { onNavigate({ lens: available.id }) }}
							className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
								available.id === activeLens
									? 'bg-accent-soft border-accent text-foreground'
									: 'border-border text-muted hover:text-foreground hover:border-border-strong'
							}`}
						>
							{available.id.replace(/-/g, ' ')}
						</button>
					))}
				</div>
			)}
			<div className="flex items-center gap-2 mb-4 text-xs">
				<span className="text-subtle">{'Window:'}</span>
				{WINDOWS.map(w => (
					<button
						key={w.id}
						type="button"
						onClick={() => { onNavigate({ window: w.id }) }}
						className={`px-2 py-1 rounded-md border transition-colors ${
							w.id === windowId
								? 'border-accent text-foreground bg-accent-soft'
								: 'border-border text-muted hover:text-foreground'
							}`}
					>
						{w.label}
					</button>
				))}
			</div>			{focus.collection === 'user' && activeLens === 'head-to-head' && (
				<div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
					<span className="text-subtle">{'Compare with:'}</span>
					{(rivalsQuery.data?.rows ?? []).map(r => (
						<button
							key={r.id}
							type="button"
							onClick={() => { onNavigate({ rival: r.id }) }}
							className={`px-2 py-1 rounded-md border transition-colors ${
								rival === r.id
									? 'border-accent text-foreground bg-accent-soft'
									: 'border-border text-muted hover:text-foreground'
									}`}
						>
							{r.label}
						</button>
					))}
					{(rivalsQuery.data?.rows ?? []).length === 0 && !rivalsQuery.isLoading && (
						<span className="text-subtle">{'no rivals found'}</span>
					)}
				</div>
			)}			<Body
				data={view.data}
				isLoading={view.isLoading || view.data === undefined}
				isError={view.isError}
				error={view.error}
				retry={() => { void view.refetch() }}
				onto={view.data?.lens.onto ?? 'row'}
				onNavigate={onNavigate}
			/>
		</div>
	)
}

function FocusHeader ({ focus, onNavigate, fallbackLabel, fallbackSubtitle }: {
	focus: NonNullable<Focus>
	onNavigate: (next: { focus?: Focus, lens?: string | null }) => void
	fallbackLabel?: string
	fallbackSubtitle?: string
}): ReactElement {
	const meta = COLLECTIONS.find(c => c.id === focus.collection)
	const label = fallbackLabel ?? focus.id

	return (
		<div className="mb-4">
			<div className="flex items-center gap-1.5 text-sm text-muted mb-1">
				<button type="button" onClick={() => { onNavigate({ focus: null, lens: null }) }} className="hover:text-foreground">
					{meta?.label ?? focus.collection}
				</button>
				<span className="text-subtle">{'/'}</span>
				<span className="text-foreground/80 truncate max-w-xs">{label}</span>
			</div>
			<h1 className="text-2xl font-semibold text-foreground truncate">{label}</h1>
			{fallbackSubtitle !== undefined && (
				<p className="text-sm text-muted mt-0.5">{fallbackSubtitle}</p>
			)}
		</div>
	)
}

/* ------------------------------ shared parts ----------------------------- */

function Header ({ title, subtitle, sort, onSort, windowId, onWindow }: {
	title: string
	subtitle?: string
	sort: string | null
	onSort: (metric: string) => void
	windowId: WindowId | null
	onWindow: (id: WindowId) => void
}): ReactElement {
	return (
		<div className="mb-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold text-foreground">{title}</h1>
					{subtitle !== undefined && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
				</div>
				{sort !== null && (
					<div className="flex items-center gap-1.5 text-xs">
						<span className="text-subtle">{'Sort:'}</span>
						{['newest', 'strategies', 'tournaments', 'gamesPlayed'].map(metric => (
							<button
								key={metric}
								type="button"
								onClick={() => { onSort(metric === 'newest' ? '' : metric) }}
								className={`px-2 py-1 rounded-md border transition-colors ${
									(metric === 'newest' && (sort === null || sort.length === 0)) || metric === sort
										? 'border-accent text-foreground bg-accent-soft'
										: 'border-border text-muted hover:text-foreground'
									}`}
							>
								{metric === 'gamesPlayed' ? 'games' : metric}
							</button>
						))}
					</div>
				)}
			</div>
			{windowId !== null && (
				<div className="flex items-center gap-2 mt-2 text-xs">
					<span className="text-subtle">{'Window:'}</span>
					{WINDOWS.map(w => (
						<button
							key={w.id}
							type="button"
								onClick={() => { onWindow(w.id) }}
							className={`px-2 py-1 rounded-md border transition-colors ${
								w.id === windowId
									? 'border-accent text-foreground bg-accent-soft'
									: 'border-border text-muted hover:text-foreground'
								}`}
						>
							{w.label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}


function Body ({ data, isLoading, isError, error, retry, onto, onNavigate }: {
	data: ViewResponse | undefined
	isLoading: boolean
	isError: boolean
	error: unknown
	retry: () => void
	onto: CollectionName | 'row'
	onNavigate: (next: { focus?: Focus, lens?: string | null }) => void
}): ReactElement {
	if (isLoading) {
		return (
			<div className="space-y-2" role="status" aria-label="Loading">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="h-14 rounded-xl bg-surface-2 animate-pulse" />
				))}
			</div>
		)
	}
	if (isError) {
		return (
			<div className="p-6 rounded-xl border border-danger/40 bg-danger/10 text-foreground">
				<p className="font-medium mb-1">{'Failed to load'}</p>
				<p className="text-sm text-muted mb-3">{error instanceof Error ? error.message : 'Unknown error'}</p>
				<button type="button" onClick={retry} className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-sm">
					{'Retry'}
				</button>
			</div>
		)
	}
	if (data === undefined || data.rows.length === 0) {
		return (
			<div className="p-10 text-center text-muted rounded-xl border border-border">
				{'Nothing here.'}
			</div>
		)
	}

	return (
		<RowList
			rows={data.rows}
			display={data.lens.display}
			pivots={data.lens.pivots}
			renderer={data.lens.renderer}
			onto={onto}
			onNavigate={onNavigate}
		/>
	)
}

function RowList ({ rows, display, pivots, renderer, onto, onNavigate }: {
	rows: ViewRow[]
	display: string[]
	pivots: LensPivot[]
	renderer: string
	onto: CollectionName | 'row'
	onNavigate: (next: { focus?: Focus, lens?: string | null }) => void
}): ReactElement {
	const selfNavigate = (row: ViewRow): void => {
		if (onto !== 'row' && typeof row.id === 'string') {
			onNavigate({ focus: { collection: onto, id: row.id }, lens: null })
		}
	}

	if (renderer === 'timeline') {
		return <Timeline rows={rows} display={display} pivots={pivots} onto={onto} onNavigate={onNavigate} />
	}

	if (renderer === 'table') {
		return (
			<div className="overflow-x-auto rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-border bg-surface-2/60">
							<th className="px-4 py-2">{'#'}</th>
							<th className="px-4 py-2">{'Player'}</th>
							{display.filter(f => f !== 'placement').map(field => (
								<th key={field} className="px-4 py-2">{fieldLabel(field)}</th>
							))}
							<th className="px-4 py-2">{'Related'}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row, i) => (
							<tr key={row.id ?? i} className="border-b border-border/60 last:border-0 hover:bg-surface-2/40">
								<td className="px-4 py-2 text-muted">{typeof row.placement === 'number' ? row.placement : i + 1}</td>
								<td className="px-4 py-2">
									<button
										type="button"
										onClick={() => { selfNavigate(row) }}
										className="font-medium text-foreground hover:text-accent transition-colors"
									>
										{row.label ?? ''}
									</button>
								</td>
								{display.filter(f => f !== 'placement').map(field => (
									<td key={field} className="px-4 py-2 text-muted">{formatStat(row[field])}</td>
								))}
								<td className="px-4 py-2"><PivotChips row={row} pivots={pivots} onNavigate={onNavigate} /></td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			{rows.map((row, i) => (
				<div
					key={row.id ?? i}
					className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 rounded-xl border border-border bg-surface/60 hover:border-border-strong transition-colors"
				>
					<div className="min-w-0 flex-1">
						<button
							type="button"
							onClick={() => { selfNavigate(row) }}
							className="font-medium text-foreground hover:text-accent transition-colors text-left"
						>
							{row.label ?? row.id ?? ''}
						</button>
						{typeof row.summary === 'string' && row.summary.length > 0 && (
							<p className="text-xs text-subtle mt-0.5 line-clamp-1">{row.summary}</p>
						)}
					</div>
					<div className="flex items-center gap-3 flex-wrap">
						{display.map(field => (
							<span key={field} className="text-xs">
								<span className="text-subtle">{fieldLabel(field)} </span>
								<span className="text-foreground/90 font-medium">{formatStat(row[field])}</span>
							</span>
						))}
						<span className="text-xs text-subtle">{formatDate(row.date)}</span>
						<PivotChips row={row} pivots={pivots} onNavigate={onNavigate} />
					</div>
				</div>
			))}
		</div>
	)
}

function PivotChips ({ row, pivots, onNavigate }: {
	row: ViewRow
	pivots: LensPivot[]
	onNavigate: (next: { focus?: Focus, lens?: string | null }) => void
}): ReactElement {
	if (pivots.length === 0) { return <span /> }
	return (
		<span className="flex items-center gap-1.5">
			{pivots.map(pivot => {
				const id = row[pivot.field]
				if (typeof id !== 'string' || id.length === 0) { return null }
				const label = row[pivot.labelField]
				return (
					<button
						key={pivot.field}
						type="button"
						title={`View ${pivot.text.toLowerCase()}`}
						onClick={() => { onNavigate({ focus: { collection: pivot.collection, id }, lens: null }) }}
						className="px-2 py-0.5 rounded-full text-[11px] bg-surface-3 text-muted hover:text-foreground hover:bg-accent-soft transition-colors max-w-[10rem]"
					>
						<span className="text-subtle">{pivot.text}:</span>{' '}
						{typeof label === 'string' ? label : '…'}
					</button>
				)
			})}
		</span>
	)
}

/* -------------------------------- timeline -------------------------------- */

// An SVG time series for timeline lenses: one point per row, x = date,
// y = the primary numeric display field. Rows remain pivots — click a point
// to focus the underlying tournament.
function Timeline ({ rows, display, pivots, onto, onNavigate }: {
	rows: ViewRow[]
	display: string[]
	pivots: LensPivot[]
	onto: CollectionName | 'row'
	onNavigate: (next: { focus?: Focus, lens?: string | null }) => void
}): ReactElement {
	const [metric, setMetric] = useState<string>(display.find(f => typeof rows[0]?.[f] === 'number') ?? '')
	const series = rows.filter(r => typeof r[metric] === 'number' && r.date !== undefined)
	const width = 720
	const height = 220
	const pad = { top: 12, right: 16, bottom: 24, left: 40 }
	const innerW = width - pad.left - pad.right
	const innerH = height - pad.top - pad.bottom

	const metrics = display.filter(f => typeof rows[0]?.[f] === 'number')

	if (series.length < 2) {
		return <div className="p-10 text-center text-muted rounded-xl border border-border">{'Not enough data points to plot.'}</div>
	}

	const times = series.map(r => new Date(r.date as string).getTime())
	const minT = Math.min(...times)
	const maxT = Math.max(...times)
	const values = series.map(r => Number(r[metric]))
	const minV = Math.min(...values)
	const maxV = Math.max(...values)
	const spanT = Math.max(1, maxT - minT)
	const spanV = Math.max(1, maxV - minV)

	const x = (t: number): number => pad.left + ((t - minT) / spanT) * innerW
	const y = (v: number): number => pad.top + innerH - ((v - minV) / spanV) * innerH

	const path = series.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(times[i]).toFixed(1)} ${y(values[i]).toFixed(1)}`).join(' ')
	const selfNavigate = (row: ViewRow): void => {
		if (onto !== 'row' && typeof row.id === 'string') {
			onNavigate({ focus: { collection: onto, id: row.id }, lens: null })
		}
	}

	return (
		<div>
			{metrics.length > 1 && (
				<div className="flex items-center gap-1.5 mb-2 text-xs">
					<span className="text-subtle">{'Plot:'}</span>
					{metrics.map(m => (
						<button
							key={m}
							type="button"
							onClick={() => { setMetric(m) }}
							className={`px-2 py-1 rounded-md border transition-colors ${
								m === metric
									? 'border-accent text-foreground bg-accent-soft'
									: 'border-border text-muted hover:text-foreground'
							}`}
						>
							{fieldLabel(m)}
						</button>
					))}
				</div>
			)}
			<svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border border-border bg-surface/60">
				{/* y axis ticks */}
				{[0, 0.5, 1].map(f => (
					<g key={f}>
						<line
							x1={pad.left} x2={width - pad.right}
							y1={pad.top + innerH * (1 - f)} y2={pad.top + innerH * (1 - f)}
							stroke="var(--border)" strokeDasharray="2 4"
						/>
						<text x={pad.left - 6} y={pad.top + innerH * (1 - f) + 3} textAnchor="end" fontSize="9" fill="var(--subtle)">
							{(minV + spanV * f).toFixed(0)}
						</text>
					</g>
				))}
				{/* x axis first/last labels */}
				<text x={pad.left} y={height - 6} fontSize="9" fill="var(--subtle)">{formatDate(series[0]?.date)}</text>
				<text x={width - pad.right} y={height - 6} textAnchor="end" fontSize="9" fill="var(--subtle)">{formatDate(series[series.length - 1]?.date)}</text>
				<path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
				{series.map((r, i) => (
					<circle
						key={r.id ?? i}
						cx={x(times[i])} cy={y(values[i])} r={3}
						fill="var(--accent)"
						className="cursor-pointer hover:r-5"
						onClick={() => { selfNavigate(r) }}
					>
						<title>{`${r.label ?? ''} — ${fieldLabel(metric)}: ${formatStat(r[metric])}`}</title>
					</circle>
				))}
			</svg>
			{/* Below the plot: the rows, as usual, so pivots stay reachable */}
			<div className="mt-3 space-y-1.5">
				{rows.map((row, i) => (
					<div key={row.id ?? i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border bg-surface/40 text-sm">
						<button
							type="button"
							onClick={() => { selfNavigate(row) }}
							className="text-muted hover:text-accent transition-colors"
						>
							{row.label ?? row.id}
						</button>
						<div className="flex items-center gap-3">
							{display.slice(0, 3).map(field => (
								<span key={field} className="text-xs text-muted">
									<span className="text-subtle">{fieldLabel(field)} </span>
									<span className="text-foreground/90">{formatStat(row[field])}</span>
								</span>
							))}
							<PivotChips row={row} pivots={pivots} onNavigate={onNavigate} />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
