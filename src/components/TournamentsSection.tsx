'use client'

import axios from 'axios'
import React, { useState, useEffect, type ReactElement, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { TournamentType } from '@/types/backendDataTypes'
import { useUser } from '@/contexts/UserProvider'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { TournamentCard as RegularTournamentCard } from '@/app/tournaments/components/TournamentCard'

// Card height constant
const CARD_HEIGHT = 160 // px

// Lazy load only the paginated tournament cards
const LazyTournamentCard = dynamic(
	() => import('@/app/tournaments/components/TournamentCard').then(mod => ({ default: mod.TournamentCard })),
	{
		loading: () => (
			<div
				className="h-[160px] bg-gray-800 rounded-lg animate-pulse"
				style={{ height: CARD_HEIGHT }}
				aria-hidden="true"
			/>
		),
		ssr: false
	}
)

const TOURNAMENTS_PER_PAGE = 5
const LATEST_LIMIT = 1
const LATEST_STANDINGS = 30
const OTHER_STANDINGS = 3

export default function TournamentsSection(): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [latestTournament, setLatestTournament] = useState<TournamentType[]>([])
	const [otherTournaments, setOtherTournaments] = useState<TournamentType[]>([])
	const [latestLoading, setLatestLoading] = useState(true)
	const [othersLoading, setOthersLoading] = useState(true)
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(1)
	const { currentUser } = useUser()
	const latestTournamentRef = useRef<HTMLDivElement>(null)
	const [shouldLoadLatest, setShouldLoadLatest] = useState(false)
	const [shouldLoadOthers, setShouldLoadOthers] = useState(false)
	const othersTriggerRef = useRef<HTMLDivElement>(null)

	// Observe latest tournament section
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setShouldLoadLatest(true)
					observer.disconnect()
				}
			},
			{ threshold: 0.1 }
		)

		if (latestTournamentRef.current) {
			observer.observe(latestTournamentRef.current)
		}

		return () => observer.disconnect()
	}, [])

	// Add observer for other tournaments trigger
	useEffect(() => {
		if (!othersTriggerRef.current || latestLoading) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setShouldLoadOthers(true)
					observer.disconnect()
				}
			},
			{ threshold: 0.1 }
		)

		observer.observe(othersTriggerRef.current)
		return () => observer.disconnect()
	}, [latestLoading])

	// Fetch latest tournament only when visible
	useEffect(() => {
		if (!shouldLoadLatest) return

		axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
			params: {
				limit: LATEST_LIMIT,
				limitStandings: LATEST_STANDINGS,
				sortFieldStandings: 'placement',
				sortDirectionStandings: 'asc',
				userIdStanding: currentUser?._id ?? null,
				getStandings: true
			}
		})
			.then(response => {
				setLatestTournament(response.data)
			})
			.catch(error => console.error('Error fetching latest tournament:', error))
			.finally(() => setLatestLoading(false))
	}, [API_URL, currentUser?._id, shouldLoadLatest])

	// Fetch paginated tournaments only when latest is loaded
	useEffect(() => {
		if (!shouldLoadOthers || latestLoading) return
		
		setOthersLoading(true)
		axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
			params: {
				skip: LATEST_LIMIT + ((page - 1) * TOURNAMENTS_PER_PAGE),
				limit: TOURNAMENTS_PER_PAGE,
				limitStandings: OTHER_STANDINGS,
				sortFieldStandings: 'placement',
				sortDirectionStandings: 'asc',
				userIdStanding: currentUser?._id ?? null,
				getStandings: true
			}
		})
			.then(response => {
				setOtherTournaments(prev =>
					page === 1 ? response.data : [...prev, ...response.data]
				)
				setHasMore(response.data.length === TOURNAMENTS_PER_PAGE)
			})
			.catch(error => console.error('Error fetching other tournaments:', error))
			.finally(() => setOthersLoading(false))
	}, [API_URL, currentUser?._id, page, shouldLoadOthers, latestLoading])

	const loadMore = useCallback(() => {
		setPage(p => p + 1)
	}, [])

	const infiniteScrollRef = useInfiniteScroll(loadMore, othersLoading, hasMore)

	return (
		<div className="p-2 sm:p-4 md:p-8">
			{/* Latest Tournament Section */}
			<div ref={latestTournamentRef}>
				{latestLoading ? (
					<div
						className="animate-pulse bg-gray-800 rounded-lg p-6 mb-6"
						style={{ height: CARD_HEIGHT }}
						role="status"
						aria-label="Loading latest tournament"
					/>
				) : (
					latestTournament.map((tournament) => (
						<div key={tournament._id} className="mb-6 relative z-10 rounded-xl">
							<RegularTournamentCard
								tournament={tournament}
								currentUserId={currentUser?._id}
								isLatest={true}
								defaultExpanded={true}
							/>
						</div>
					))
				)}
			</div>

			{/* Trigger element for other tournaments */}
			<div ref={othersTriggerRef} className="h-px w-full" />

			{/* Other Tournaments Section */}
			{!latestLoading && shouldLoadOthers && (
				<div className="space-y-6 relative z-0">
					{otherTournaments.map((tournament) => (
						<LazyTournamentCard
							key={tournament._id}
							tournament={tournament}
							currentUserId={currentUser?._id}
							isLatest={false}
							defaultExpanded={false}
						/>
					))}

					{othersLoading && (
						<div
							className="animate-pulse bg-gray-800 rounded-lg p-6"
							style={{ height: CARD_HEIGHT }}
							aria-hidden="true"
						/>
					)}
					<div ref={infiniteScrollRef} className="h-px w-full" />
				</div>
			)}

			{latestTournament.length === 0 &&
				otherTournaments.length === 0 &&
				!latestLoading &&
				!othersLoading && (
				<p className="text-white text-center mt-4">{'No tournaments found.'}</p>
			)}
		</div>
	)
}
