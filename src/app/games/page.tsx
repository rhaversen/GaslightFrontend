'use client'

import axios from 'axios'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { useUser } from '@/contexts/UserProvider'
import { GameType } from '@/types/backendDataTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function GamesPage () {
	const [games, setGames] = useState<GameType[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const { currentUser } = useUser()
	const [userStats, setUserStats] = useState<{
		[key: string]: {
			submissionCount: number
			activeStrategy?: string
			activeStrategyId?: string
			latestStanding?: { score: number; percentileRank: number }
		}
	}>(() => ({}))

	useEffect(() => {
		const fetchGames = async () => {
			try {
				const response = await axios.get<GameType[]>(`${API_URL}/v1/games`)
				setGames(response.data)
			} catch (error) {
				console.error('Error fetching games:', error)
				setGames([])
			} finally {
				setIsLoading(false)
			}
		}

		fetchGames()
	}, [])

	useEffect(() => {
		if (!currentUser || games.length === 0) { return }
		const fetchUserStats = async () => {
			const stats: { [key: string]: any } = {}
			await Promise.all(games.map(async (game) => {
				try {
					const submissionsRes = await axios.get(`${API_URL}/v1/submissions`, {
						params: { game: game._id, user: currentUser._id }
					})
					const subs = submissionsRes.data
					const latestTournRes = await axios.get(`${API_URL}/v1/tournaments`, {
						params: {
							game: game._id,
							limit: 1,
							getStandings: true,
							userIdStanding: currentUser._id
						}
					})
					const lastTourn = latestTournRes.data[0]
					stats[game._id] = {
						submissionCount: subs.length,
						activeStrategy: subs.find((s: any) => s.active)?.title,
						activeStrategyId: subs.find((s: any) => s.active)?._id,
						latestStanding: lastTourn?.userStanding
							? {
								score: lastTourn.userStanding.score,
								percentileRank: lastTourn.userStanding.percentileRank
							}
							: undefined
					}
				} catch {
					stats[game._id] = { submissionCount: 0 }
				}
			}))
			setUserStats(stats)
		}
		fetchUserStats()
	}, [games, currentUser])

	if (isLoading) {
		return <div className="p-6">{'Loading...'}</div>
	}

	return (
		<main className="container mx-auto p-6">
			<h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
				{'Available Games\r'}
			</h1>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{games.map((game) => (
					<div key={game._id} className="block bg-white rounded-xl border border-gray-200 shadow-sm p-6">
						<h2 className="text-2xl font-semibold mb-3 text-gray-800">
							{game.name}
						</h2>
						<p className="text-gray-600 mb-4 line-clamp-3">
							{game.summary}
						</p>
						<div className="text-sm text-gray-500 mb-4">
							<div className="mr-4">
								{'Submitted Players: '}{game.submissionCount}
							</div>
							<div className="mr-4">
								{(() => {
									switch (game.batchSize) {
										case 1:
											return 'Single player game'
										case 2:
											return 'Two player game'
										default:
											return `${game.batchSize} players pr. game`
									}
								})()}
							</div>
						</div>
						<Link href={`/games/${game._id}`} className="text-blue-600 hover:text-blue-800 mt-4 block">
							{'View Game Info'}
						</Link>
						{currentUser && userStats[game._id] !== undefined && (
							<div className="mt-3 text-sm text-gray-600 border-t pt-2">
								<p>
									{'Submissions: '}
									<Link href={`/users/${currentUser._id}/strategies/?game=${game._id}`} className="text-blue-600 hover:text-blue-800">
										{userStats[game._id].submissionCount}
									</Link>
								</p>
								{userStats[game._id].activeStrategy && (
									<p>
										{'Active Strategy: '}
										<Link href={`/strategies/${userStats[game._id].activeStrategyId}`} className="text-blue-600 hover:text-blue-800">
											{userStats[game._id].activeStrategy}
										</Link>
									</p>
								)}
								{userStats[game._id].latestStanding && (
									<div className="mt-2">
										<p>{`Score: ${userStats[game._id].latestStanding?.percentileRank.toFixed(1)}%`}</p>
										<p>{`Raw Score: ${userStats[game._id].latestStanding?.score.toFixed(3)}`}</p>
									</div>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{games.length === 0 && (
				<div className="text-center text-gray-600 mt-8">
					{'No games available at the moment.\r'}
				</div>
			)}
		</main>
	)
}
