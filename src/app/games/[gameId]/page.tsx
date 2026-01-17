'use client'

import axios from 'axios'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import SubmissionsGraph from '@/components/SubmissionsGraph'
import { useUser } from '@/contexts/UserProvider'
import { GameType, TournamentType, SubmissionType } from '@/types/backendDataTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function GamePage () {
	const params = useParams()
	const gameId = params.gameId
	const { currentUser } = useUser()
	const [game, setGame] = useState<GameType | null>(null)
	const [latestTournament, setLatestTournament] = useState<TournamentType | null>(null)
	const [gameStats, setGameStats] = useState({
		totalSubmissions: 0,
		totalTournaments: 0
	})
	const [userStats, setUserStats] = useState({
		submissionCount: 0,
		activeStrategy: null as SubmissionType | null
	})
	const [tournamentsGraph, setTournamentsGraph] = useState<TournamentType[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchGameDetails = async () => {
			try {
				// Get game details, latest tournament, submissions, tournaments count, and tournaments for graph in parallel
				const [
					gameResponse,
					tournamentResponse,
					submissionsCountResponse,
					tournamentsCountResponse,
					tournamentsGraphResponse
				] = await Promise.all([
					axios.get<GameType>(`${API_URL}/v1/games/${gameId}`),
					axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
						params: {
							game: gameId,
							limit: 1,
							skip: 0,
							getStandings: true,
							limitStandings: 10,
							sortFieldStandings: 'score',
							sortDirectionStandings: 'desc',
							userIdStanding: currentUser?._id
						}
					}),
					axios.get<SubmissionType[]>(`${API_URL}/v1/submissions`, {
						params: {
							active: true,
							game: gameId
						}
					}),
					axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
						params: {
							game: gameId
						}
					}),
					axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`, {
						params: {
							game: gameId,
							getStandings: Boolean(currentUser),
							userIdStanding: currentUser?._id
						}
					})
				])

				setGame(gameResponse.data)
				setLatestTournament(tournamentResponse.data.length > 0 ? tournamentResponse.data[0] : null)
				setGameStats({
					totalSubmissions: submissionsCountResponse.data.length,
					totalTournaments: tournamentsCountResponse.data.length
				})
				setTournamentsGraph(tournamentsGraphResponse.data)

				if (currentUser) {
					const userSubmissionsResponse = await axios.get<SubmissionType[]>(
						`${API_URL}/v1/submissions`,
						{
							params: {
								game: gameId,
								user: currentUser._id,
								maxAmount: 100
							},
							withCredentials: true
						}
					)

					setUserStats({
						submissionCount: userSubmissionsResponse.data.length,
						activeStrategy: userSubmissionsResponse.data.find(sub => sub.active) || null
					})
				}
			} catch (err) {
				console.error('Error fetching game details:', err)
				setGame(null)
				setLatestTournament(null)
				setGameStats({
					totalSubmissions: 0,
					totalTournaments: 0
				})
			} finally {
				setIsLoading(false)
			}
		}

		fetchGameDetails()
	}, [gameId, currentUser])

	if (isLoading || !game) {
		return <div className="p-6">{'Loading...'}</div>
	}

	return (
		<main className="container mx-auto p-6">
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
					{game.name}
				</h1>
				<p className="text-gray-700 mb-4">{game.summary}</p>
			</div>

			{/* Submissions Over Time Graph Section */}
			<section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
				<h2 className="text-2xl font-semibold mb-4 text-gray-800">{'Submissions Over Time'}</h2>
				{tournamentsGraph.length > 0 ? (
					<SubmissionsGraph
						tournaments={tournamentsGraph}
						showUserStanding={Boolean(currentUser)}
					/>
				) : (
					<div className="h-64 flex items-center justify-center text-gray-600">
						{'No data available'}
					</div>
				)}
			</section>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Game Statistics */}
				<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
					<h2 className="text-2xl font-semibold mb-4 text-gray-800">{'Game Statistics'}</h2>
					<div className="space-y-3 text-gray-700">
						<p><span className="font-medium text-gray-900">{'Players per Game:'}</span> {game.batchSize}</p>
						<p><span className="font-medium text-gray-900">{'Total Submissions:'}</span> {gameStats.totalSubmissions}</p>
						<p><span className="font-medium text-gray-900">{'Total Tournaments:'}</span> {gameStats.totalTournaments}</p>
					</div>
				</div>

				{/* Latest Tournament */}
				<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
					<h2 className="text-2xl font-semibold mb-4 text-gray-800">{'Latest Tournament'}</h2>
					{latestTournament ? (
						<div className="space-y-3 text-gray-700">
							<p><span className="font-medium text-gray-900">{'Date:'}</span> {new Date(latestTournament.createdAt).toLocaleDateString()}</p>
							<p><span className="font-medium text-gray-900">{'Participants:'}</span> {latestTournament.submissionCount}</p>
							<Link
								href={`/tournaments/${latestTournament._id}`}
								className="inline-block mt-2 text-blue-600 hover:text-blue-800"
							>
								{'View Details →'}
							</Link>
						</div>
					) : (
						<p className="text-gray-600">{'No tournaments yet'}</p>
					)}
				</div>

				{/* User Statistics - Only shown when logged in */}
				{currentUser && (
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<h2 className="text-2xl font-semibold mb-4 text-gray-800">{'Your Activity'}</h2>
						<div className="space-y-3 text-gray-700">
							<p><span className="font-medium text-gray-900">{'Your Submissions:'}</span> {userStats.submissionCount}</p>
							{userStats.activeStrategy && (
								<p><span className="font-medium text-gray-900">{'Active Strategy:'}</span> {userStats.activeStrategy.title}</p>
							)}
							{latestTournament?.userStanding && (
								<div className="space-y-2">
									<p className="font-medium text-gray-900">{'Latest Tournament Performance:'}</p>
									<div className="ml-4">
										<p>{'Score: '}{latestTournament.userStanding.score}</p>
										<p>{'Rank: '}{latestTournament.userStanding.percentileRank}</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Description Card */}
				<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
					<h2 className="text-2xl font-semibold mb-4 text-gray-800">{'Description'}</h2>
					<div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
						{game.description}
					</div>
				</div>
			</div>

			<div className="mt-8 flex gap-4">
				{currentUser && (
					<Link
						href={`/strategies/new?game=${gameId}`}
						className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition-all inline-block font-medium"
					>
						{'Create New Strategy'}
					</Link>
				)}
				<Link
					href={`/tournaments?game=${gameId}`}
					className="bg-white text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-50 transition-all inline-block border border-gray-200 font-medium"
				>
					{'View All Tournaments'}
				</Link>
			</div>
		</main>
	)
}
