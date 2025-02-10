'use client'

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { GameType, TournamentType } from '@/types/backendDataTypes'
import { TournamentCard as RegularTournamentCard } from './TournamentCard'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

const CARD_HEIGHT = 160 // px
const TOURNAMENTS_PER_PAGE = 5
const LATEST_LIMIT = 1
const LATEST_STANDINGS = 30
const OTHER_STANDINGS = 3

// Lazy load paginated tournament card
const LazyTournamentCard = dynamic(
	() => import('./TournamentCard').then(mod => ({ default: mod.TournamentCard })),
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

interface SingleGameTournamentsProps {
	game: GameType,
	API_URL: string | undefined,
	currentUser: any
}

export default function SingleGameTournaments({ game, API_URL, currentUser }: SingleGameTournamentsProps) {
	const [latestTournament, setLatestTournament] = useState<TournamentType[]>([])
	const [otherTournaments, setOtherTournaments] = useState<TournamentType[]>([])
	const [latestLoading, setLatestLoading] = useState(true)
	const [othersLoading, setOthersLoading] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(1)

	useEffect(() => {
		const fetchLatestTournament = async () => {
			try {
				setLatestLoading(true)
				const response = await axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
					params: {
						game: game._id,
						limit: LATEST_LIMIT,
						limitStandings: LATEST_STANDINGS,
						sortFieldStandings: 'placement',
						sortDirectionStandings: 'asc',
						userIdStanding: currentUser?._id ?? null,
						getStandings: true
					}
				})
				setLatestTournament(response.data)
			} catch (error) {
				console.error('Error fetching latest tournament:', error)
				setLatestTournament([])
			} finally {
				setLatestLoading(false)
			}
		}
		fetchLatestTournament()
	}, [API_URL, currentUser?._id, game])

	useEffect(() => {
		const fetchPaginatedTournaments = async () => {
			setOthersLoading(true)
			try {
				const response = await axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
					params: {
						game: game._id,
						skip: LATEST_LIMIT + ((page - 1) * TOURNAMENTS_PER_PAGE),
						limit: TOURNAMENTS_PER_PAGE,
						limitStandings: OTHER_STANDINGS,
						sortFieldStandings: 'placement',
						sortDirectionStandings: 'asc',
						userIdStanding: currentUser?._id ?? null,
						getStandings: true
					}
				})
				setOtherTournaments(prev => page === 1 ? response.data : [...prev, ...response.data])
				setHasMore(response.data.length === TOURNAMENTS_PER_PAGE)
			} catch (error) {
				console.error('Error fetching paginated tournaments:', error)
			} finally {
				setOthersLoading(false)
			}
		}
		fetchPaginatedTournaments()
	}, [API_URL, currentUser?._id, game, page])

	const loadMore = useCallback(() => {
		setPage(prev => prev + 1)
	}, [])

	const infiniteScrollRef = useInfiniteScroll(loadMore, othersLoading, hasMore)
	return (
		<section className="space-y-6">
			<h2 className="text-2xl font-semibold text-gray-100">
				{`Latest ${game.name} Tournaments`}
			</h2>
			{latestLoading ? (
				<div className="animate-pulse bg-gray-800 rounded-lg p-6" style={{ height: CARD_HEIGHT }} role="status" aria-label="Loading tournament" />
			) : (
				latestTournament.map(tournament => (
					<div key={tournament._id}>
						<RegularTournamentCard
							tournament={tournament}
							currentUserId={currentUser?._id}
							defaultExpanded={true}
							badge="Latest Tournament"
						/>
					</div>
				))
			)}
			
			<h2 className="text-2xl font-semibold text-gray-100">{'Previous Tournaments'}</h2>
			<div className="space-y-6 relative z-0">
				{otherTournaments.map(tournament => (
					<LazyTournamentCard
						key={tournament._id}
						tournament={tournament}
						currentUserId={currentUser?._id}
						defaultExpanded={false}
					/>
				))}
				{othersLoading && (
					<div className="animate-pulse bg-gray-800 rounded-lg p-6" style={{ height: CARD_HEIGHT }} aria-hidden="true" />
				)}
				<div ref={infiniteScrollRef} className="h-px w-full" />
			</div>
			{!latestLoading && !othersLoading && latestTournament.length === 0 && otherTournaments.length === 0 && (
				<p className="text-white text-center mt-4">{'No tournaments found.'}</p>
			)}
		</section>
	)
}
