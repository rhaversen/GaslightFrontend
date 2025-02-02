'use client'

import axios from 'axios'
import Link from 'next/link'
import React, { useState, useEffect, type ReactElement, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { TournamentType } from '@/types/backendDataTypes'
import { useUser } from '@/contexts/UserProvider'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { TournamentCard as RegularTournamentCard } from './components/TournamentCard'

// Add card height constant
const CARD_HEIGHT = 160 // px

// Lazy load only the paginated tournament cards
const LazyTournamentCard = dynamic(
	() => import('./components/TournamentCard').then(mod => ({ default: mod.TournamentCard })),
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

export default function Page(): ReactElement<any> {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [latestTournament, setLatestTournament] = useState<TournamentType[]>([])
	const [otherTournaments, setOtherTournaments] = useState<TournamentType[]>([])
	const [latestLoading, setLatestLoading] = useState(true)
	const [othersLoading, setOthersLoading] = useState(true)
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(1)
	const { currentUser } = useUser()

	// Fetch latest tournament
	useEffect(() => {
		axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
			params: {
				limit: LATEST_LIMIT,
				limitStandings: LATEST_STANDINGS,
				sortFieldStandings: 'placement',
				sortDirectionStandings: 'asc',
				userIdStanding: currentUser?._id ?? null
			}
		})
			.then(response => setLatestTournament(response.data))
			.catch(error => console.error('Error fetching latest tournament:', error))
			.finally(() => setLatestLoading(false))
	}, [API_URL, currentUser?._id])

	// Fetch paginated tournaments
	useEffect(() => {
		setOthersLoading(true)
		axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
			params: {
				skip: LATEST_LIMIT + ((page - 1) * TOURNAMENTS_PER_PAGE),
				limit: TOURNAMENTS_PER_PAGE,
				limitStandings: OTHER_STANDINGS,
				sortFieldStandings: 'placement',
				sortDirectionStandings: 'asc',
				userIdStanding: currentUser?._id ?? null
			}
		})
			.then(response => {
				setOtherTournaments(prev => 
					page === 1 
						? response.data 
						: [...prev, ...response.data]
				)
				setHasMore(response.data.length === TOURNAMENTS_PER_PAGE)
			})
			.catch(error => console.error('Error fetching other tournaments:', error))
			.finally(() => setOthersLoading(false))
	}, [API_URL, currentUser?._id, page])

	const loadMore = useCallback(() => {
		setPage(p => p + 1)
	}, [])

	const infiniteScrollRef = useInfiniteScroll(loadMore, othersLoading, hasMore)

	return (
		<main className="p-2 sm:p-4 md:p-8 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<div className="flex items-center gap-4 mb-6">
				<Link
					href="/"
					className="px-3 py-1.5 text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:border-gray-600"
				>
					{'←'}<span className="ml-2">{'Home'}</span>
				</Link>
				<h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300">
					{'Tournaments'}
				</h1>
			</div>
      
			{/* Latest Tournament Section */}
			{latestLoading ? (
				<div 
					className="animate-pulse bg-gray-800 rounded-lg p-6 mb-6"
					style={{ height: CARD_HEIGHT }}
					role="status"
					aria-label="Loading latest tournament"
				/>
			) : (
				latestTournament.map((tournament) => (
					<div key={tournament._id} className="mb-6 relative z-10">
						<RegularTournamentCard
							tournament={tournament}
							currentUserId={currentUser?._id}
							isLatest={true}
							defaultExpanded={true}
						/>
					</div>
				))
			)}

			{/* Other Tournaments Section */}
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
			{
				latestTournament.length === 0 && 
        otherTournaments.length === 0 && 
        !latestLoading && 
        !othersLoading && (
					<p className="text-white text-center mt-4">{'No tournaments found.'}</p>
				)
			}
		</main>
	)
}
