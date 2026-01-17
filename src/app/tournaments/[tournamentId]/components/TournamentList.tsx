'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { formatDate } from '@/lib/dateUtils'
import { TournamentType } from '@/types/backendDataTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const ITEMS_PER_PAGE = 30

export function TournamentList ({ selectedId }: { selectedId: string }) {
	const [tournaments, setTournaments] = useState<TournamentType[]>([])
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)
	const [isCollapsed, setIsCollapsed] = useState(true)
	const [hasScrolledToSelected, setHasScrolledToSelected] = useState(false)
	const router = useRouter()

	const scrollToSelected = useCallback(() => {
		if (!selectedId || loading || !tournaments.length) {
			return // Don't attempt to scroll if we don't have data yet
		}

		let attempts = 0
		const maxAttempts = 5

		const tryScroll = () => {
			const selectedElement = document.getElementById(`tournament-${selectedId}`)
			const scrollContainer = document.getElementById('tournament-list-container')

			if (selectedElement && scrollContainer) {
				const containerRect = scrollContainer.getBoundingClientRect()
				const elementRect = selectedElement.getBoundingClientRect()

				const isInView = (
					elementRect.top >= containerRect.top &&
                    elementRect.bottom <= containerRect.bottom
				)

				if (!isInView) {
					scrollContainer.scrollTo({
						top: selectedElement.offsetTop - (scrollContainer.clientHeight / 2) + (selectedElement.clientHeight / 2),
						behavior: 'smooth'
					})
				}
				return true
			}

			attempts++
			if (attempts < maxAttempts) {
				setTimeout(tryScroll, 200)
			}
			return false
		}

		setTimeout(tryScroll, 100)
	}, [selectedId, loading, tournaments.length])

	// Only attempt to scroll on initial load
	useEffect(() => {
		if (selectedId && !loading && tournaments.length > 0 && !hasScrolledToSelected) {
			scrollToSelected()
			setHasScrolledToSelected(true)
		}
	}, [selectedId, loading, tournaments.length, scrollToSelected, hasScrolledToSelected])

	useEffect(() => {
		setLoading(true)
		axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
			params: {
				limit: ITEMS_PER_PAGE,
				skip: (page - 1) * ITEMS_PER_PAGE,
				getStandings: false
			}
		})
			.then(response => {
				setTournaments(prev =>
					page === 1 ? response.data : [...prev, ...response.data]
				)
				setHasMore(response.data.length === ITEMS_PER_PAGE)
			})
			.catch(error => console.error('Error fetching tournaments:', error))
			.finally(() => setLoading(false))
	}, [page])

	const loadMore = useCallback(() => {
		if (!loading && hasMore) {
			setPage(p => p + 1)
		}
	}, [loading, hasMore])

	const infiniteScrollRef = useInfiniteScroll(loadMore, loading, hasMore)

	// Group tournaments by month
	const groupedTournaments = tournaments.reduce((groups, tournament) => {
		const date = new Date(tournament.createdAt)
		const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
		groups[monthYear] ??= []
		groups[monthYear].push(tournament)
		return groups
	}, {} as Record<string, TournamentType[]>)

	return (
		<>
			{/* Backdrop with smooth transition */}
			<div
				className={`
                    fixed inset-0 bg-black/50 transition-opacity duration-300
                    ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                    z-40
                `}
				onClick={() => setIsCollapsed(true)}
			/>

			{/* Placeholder for layout space */}
			<div className="w-16 shrink-0" />

			{/* List container - always fixed */}
			<div className={`
                fixed left-0 top-0 h-screen
                bg-gradient-to-br from-gray-700 to-gray-800
                border-r border-indigo-500
                transition-all duration-300 ease-out flex flex-col
                z-50
                ${isCollapsed ? 'w-16' : 'w-[150px]'}
            `}>
				{/* Expand/collapse button */}
				<div
					className="fixed left-0 top-0 h-screen pointer-events-none z-[60] ease-out transition-all duration-300"
					style={{
						width: isCollapsed ? '64px' : '150px'
					}}
				>
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className={`
                            absolute -right-5 top-1/2 -translate-y-1/2
                            w-5 h-24 rounded-r-md flex items-center justify-center
                            bg-gray-800 hover:bg-gray-700 transition-all
                            text-gray-400 hover:text-gray-200 text-sm
                            border-r border-b border-t border-indigo-500
                            shadow-lg pointer-events-auto
                        `}
					>
						{isCollapsed ? '>' : '<'}
					</button>
				</div>

				<div
					id="tournament-list-container"
					className="flex-1 overflow-y-auto no-scrollbar"
				>
					{Object.entries(groupedTournaments).map(([monthYear, monthTournaments]) => (
						<div key={monthYear} className="relative">
							<div className={`
                                sticky top-0 z-10 backdrop-blur-sm px-4 py-2
                                text-sm font-medium text-gray-400 border-y border-gray-700 overflow-clip text-nowrap
                                bg-gray-800
                            `}>
								{isCollapsed
									? new Date(monthTournaments[0].createdAt).toLocaleString('en-US', { month: 'short' })
									: monthYear
								}
							</div>
							{monthTournaments.map(tournament => (
								<button
									id={`tournament-${tournament._id}`}
									key={tournament._id}
									onClick={() => router.push(`/tournaments/${tournament._id}`)}
									className={`
                                        w-full h-[68px] text-left transition-colors relative overflow-clip text-nowrap
                                        ${isCollapsed ? 'py-2' : 'p-3'}
                                        ${tournament._id === selectedId
									? 'bg-indigo-600 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-indigo-500'
									: 'hover:bg-gray-800'
								}
                                    `}
									title={formatDate(new Date(tournament.createdAt))}
								>
									{isCollapsed ? (
										<div className="text-gray-400 text-sm text-center flex flex-col justify-center h-full">
											<div>{new Date(tournament.createdAt).toLocaleString('en-US', { day: '2-digit' })}</div>
											<div className="text-xs">{new Date(tournament.createdAt).toLocaleString('en-US', { month: 'short' })}</div>
										</div>
									) : (
										<>
											<div className="text-gray-200 font-medium">
												{formatDate(new Date(tournament.createdAt))}
											</div>
											<div className="text-gray-400 text-sm">
												{tournament.submissionCount} {'participants\r'}
											</div>
										</>
									)}
								</button>
							))}
						</div>
					))}
					{loading && <LoadingPlaceholder variant="dark" />}
					<div ref={infiniteScrollRef} className="h-px w-full" />
				</div>
			</div>
		</>
	)
}
