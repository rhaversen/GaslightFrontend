'use client'

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { TournamentType, GameType } from '@/types/backendDataTypes'
import { TournamentCard as RegularTournamentCard } from './TournamentCard'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

const CARD_HEIGHT = 160
const TOURNAMENTS_PER_PAGE = 5
const LATEST_STANDINGS = 3

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

interface LatestTournamentsProps {
	API_URL: string | undefined
	currentUser: any
	games: GameType[]
}

export default function LatestTournaments({ API_URL, currentUser, games }: LatestTournamentsProps) {
	const [tournaments, setTournaments] = useState<TournamentType[]>([])
	const [loading, setLoading] = useState(true)
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(1)

	useEffect(() => {
		const fetchTournaments = async () => {
			try {
				setLoading(true)
				// Only load a subset of games based on the current page
				const gamesToFetch = games.slice(0, page * TOURNAMENTS_PER_PAGE)
				const tournamentsResponses = await Promise.all(
					gamesToFetch.map(game =>
						axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
							params: {
								game: game._id,
								limit: 1, // Only one tournament per game
								limitStandings: LATEST_STANDINGS,
								sortFieldStandings: 'placement',
								sortDirectionStandings: 'asc',
								userIdStanding: currentUser?._id ?? null,
								getStandings: true
							}
						})
					)
				)
				// Extract the first tournament from each response if available
				const newTournaments = tournamentsResponses
					.map(response => response.data[0])
					.filter((t): t is TournamentType => t !== null && t !== undefined)
				// Avoid duplicates: only append tournaments that haven't been loaded yet
				setTournaments(prev => {
					if (page === 1) {
						return newTournaments
					}
					return [...prev, ...newTournaments.slice(prev.length)]
				})
				setHasMore(page * TOURNAMENTS_PER_PAGE < games.length)
			} catch (error) {
				console.error('Error fetching tournaments:', error)
			} finally {
				setLoading(false)
			}
		}

		if (games.length > 0) {
			fetchTournaments()
		}
	}, [API_URL, currentUser?._id, games, page])

	const loadMore = useCallback(() => {
		setPage(prev => prev + 1)
	}, [])

	const infiniteScrollRef = useInfiniteScroll(loadMore, loading, hasMore)

	return (
		<section className="space-y-6">
			<h2 className="text-2xl font-semibold text-gray-100">{'Latest Tournaments'}</h2>
			<div className="space-y-6 relative z-0">
				{tournaments.map((tournament, index) => (
					index === 0 ? (
						<RegularTournamentCard
							key={tournament._id}
							tournament={tournament}
							currentUserId={currentUser?._id}
							defaultExpanded={false}
							badge={games.find(g => g._id === tournament.game)?.name}
						/>
					) : (
						<LazyTournamentCard
							key={tournament._id}
							tournament={tournament}
							currentUserId={currentUser?._id}
							defaultExpanded={false}
							badge={games.find(g => g._id === tournament.game)?.name}
						/>
					)
				))}
				{loading && (
					<div 
						className="animate-pulse bg-gray-800 rounded-lg p-6" 
						style={{ height: CARD_HEIGHT }} 
						aria-hidden="true" 
					/>
				)}
				<div ref={infiniteScrollRef} className="h-px w-full" />
			</div>
			{!loading && tournaments.length === 0 && (
				<p className="text-white text-center mt-4">{'No tournaments found.'}</p>
			)}
		</section>
	)
}
