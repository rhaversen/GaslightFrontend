import axios, { AxiosError } from 'axios'

import type { GameType, SubmissionType, TournamentCycleStatus, TournamentStatistics, TournamentType, UserType } from './types/backendDataTypes'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'

// Cookies ride along on every request (session-based auth behind NGINX)
const client = axios.create({
	baseURL: API_BASE,
	withCredentials: true
})

export class ApiError extends Error {
	public readonly status: number
	public readonly fieldErrors: Record<string, string[]> | undefined

	constructor (status: number, message: string, fieldErrors?: Record<string, string[]>) {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.fieldErrors = fieldErrors
	}
}

function describeValidation (data: { error?: string, details?: { fieldErrors?: Record<string, string[]>, formErrors?: string[] } }): string {
	const parts: string[] = []
	if (data.details !== undefined) {
		if (data.details.fieldErrors !== undefined) {
			for (const [field, errs] of Object.entries(data.details.fieldErrors)) {
				if (errs.length > 0) parts.push(`${field}: ${errs.join(', ')}`)
			}
		}
		if (data.details.formErrors !== undefined && data.details.formErrors.length > 0) {
			parts.push(...data.details.formErrors)
		}
	}
	const base = typeof data.error === 'string' ? data.error : 'Validation failed'
	return parts.length > 0 ? `${base} — ${parts.join('; ')}` : base
}

function toApiError (error: unknown): ApiError {
	// Network failure (no response at all)
	if (!(error instanceof AxiosError) || error.response === undefined) {
		const message = error instanceof Error ? error.message : 'Network error'
		return new ApiError(0, message)
	}
	const data = error.response.data as { error?: string, details?: { fieldErrors?: Record<string, string[]>, formErrors?: string[] } } | undefined
	if (data !== undefined && data.details !== undefined) {
		return new ApiError(error.response.status, describeValidation(data), data.details.fieldErrors)
	}
	const msg = data?.error ?? error.response.statusText
	return new ApiError(error.response.status, typeof msg === 'string' ? msg : JSON.stringify(msg))
}

async function request<T> (path: string, init?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown, params?: Record<string, string | number | boolean | undefined> }): Promise<T> {
	try {
		const res = await client.request<T>({
			url: path,
			method: init?.method ?? 'GET',
			data: init?.body,
			params: init?.params
		})
		return res.data
	} catch (error) {
		throw toApiError(error)
	}
}

function query (params: Record<string, string | number | boolean | undefined>): Record<string, string | number | boolean> {
	const clean: Record<string, string | number | boolean> = {}
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) { clean[key] = value }
	}
	return clean
}

export const authApi = {
	login: (body: { email: string, password: string, stayLoggedIn?: boolean }) =>
		request<{ auth: boolean, user: UserType }>('/v1/auth/login-user-local', { method: 'POST', body }),

	logout: () =>
		request<{ message: string }>('/v1/auth/logout-local', { method: 'POST' }),

	me: () =>
		request<UserType>('/v1/auth/user'),

	signup: (body: { email: string, password: string, confirmPassword: string }) =>
		request<{ auth: boolean, user: UserType }>('/v1/users', { method: 'POST', body })
}

export const usersApi = {
	list: () =>
		request<UserType[]>('/v1/users'),

	get: (id: string) =>
		request<UserType>(`/v1/users/${id}`),

	update: (id: string, body: { username?: string, password?: string, confirmPassword?: string }) =>
		request<UserType>(`/v1/users/${id}`, { method: 'PATCH', body })
}

export const gamesApi = {
	list: () =>
		request<GameType[]>('/v1/games'),

	get: (id: string) =>
		request<GameType>(`/v1/games/${id}`)
}

export const tournamentsApi = {
	list: (params: {
		game?: string
		limit?: number
		skip?: number
		getStandings?: boolean
		limitStandings?: number
		skipStandings?: number
		sortFieldStandings?: string
		sortDirectionStandings?: string
		userIdStanding?: string
		includesUser?: string
		fromDate?: string
		toDate?: string
	} = {}) =>
		request<TournamentType[]>('/v1/tournaments', { params: query(params) }),

	/**
	 * Status of the daily tournament cycle (fires at UTC midnight). The
	 * tournamentInProgress flag is derived server-side from whether a
	 * tournament already exists for the current UTC day.
	 */
	status: () =>
		request<TournamentCycleStatus>('/v1/tournaments/status'),

	get: (id: string, params: { getStandings?: boolean, userIdStanding?: string } = {}) =>
		request<TournamentType>(`/v1/tournaments/${id}`, { params: query(params) }),

	standings: (id: string, params: {
		limitStandings?: number
		skipStandings?: number
		sortFieldStandings?: string
		sortDirectionStandings?: string
	} = {}) =>
		request<TournamentType['standings']>(`/v1/tournaments/${id}/standings`, { params: query(params) }),

	statistics: (id: string) =>
		request<TournamentStatistics>(`/v1/tournaments/${id}/statistics`)
}

export const submissionsApi = {
	list: (params: {
		game?: string
		user?: string
		active?: boolean
		passedEvaluation?: boolean
		maxAmount?: number
		startIndex?: number
	} = {}) =>
		request<SubmissionType[]>('/v1/submissions', { params: query(params) }),

	get: (id: string) =>
		request<SubmissionType>(`/v1/submissions/${id}`),

	create: (body: { title: string, code: string, game: string }) =>
		request<SubmissionType>('/v1/submissions', { method: 'POST', body }),

	update: (id: string, body: { title?: string, code?: string, active?: boolean }) =>
		request<SubmissionType>(`/v1/submissions/${id}`, { method: 'PATCH', body }),

	delete: (id: string) =>
		request<void>(`/v1/submissions/${id}`, { method: 'DELETE' }),

	evaluate: (id: string) =>
		request<SubmissionType>(`/v1/submissions/${id}/evaluate`, { method: 'POST' })
}

/* ---- Lens view system ---- */

export type CollectionName = 'user' | 'game' | 'tournament' | 'strategy'
export type ViewRenderer = 'list' | 'table' | 'timeline' | 'timeline-multi' | 'compare'

export interface ViewRow {
	date?: string
	id?: string
	label?: string
	summary?: string
	[key: string]: unknown
}

export interface ViewFocus {
	label: string
	subtitle?: string
}

export interface LensPivot {
	field: string
	labelField: string
	collection: CollectionName
	text: string
}

export interface ViewResponse {
	rows: ViewRow[]
	total: number
	focus?: ViewFocus
	lens: {
		id: string
		from: CollectionName
		onto: CollectionName | 'row'
		cardinality: 'one' | 'many'
		dateField: string
		renderer: ViewRenderer
		description: string
		display: string[]
		pivots: LensPivot[]
	}
	window: { from?: string, to?: string }
	availableLenses: Array<{ id: string, description: string, renderer: ViewRenderer }>
}

export interface ViewQuery extends Record<string, string | number | boolean | undefined> {
	lens?: string
	q?: string
	from?: string
	to?: string
	me?: string
	limit?: number
	skip?: number
}

export interface LensMeta {
	id: string
	description: string
	renderer: ViewRenderer
	scopes: 'document' | 'collection' | 'both'
}

export const viewApi = {
	collection: (collection: CollectionName, params: ViewQuery = {}) =>
		request<ViewResponse>(`/v1/view/${collection}`, { params: query(params) }),

	document: (collection: CollectionName, id: string, params: ViewQuery = {}) =>
		request<ViewResponse>(`/v1/view/${collection}/${id}`, { params: query(params) }),

	/** Lens metadata for a collection — no pipeline execution. */
	meta: (collection: CollectionName) =>
		request<{ lenses: LensMeta[] }>(`/v1/view/${collection}/meta`)
}
