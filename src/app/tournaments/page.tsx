'use client'

import axios from 'axios'
import React, { useState, useEffect, type ReactElement } from 'react'
import { TournamentType } from '@/types/backendDataTypes'
import { formatDate } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/timeUtils'
import { WinnerDisplay } from './components/WinnerDisplay'
import { StatsDisplay } from './components/StatsDisplay'
import { RunnerUpDisplay } from './components/RunnersUp'

export default function Page(): ReactElement<any> {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [tournaments, setTournaments] = useState<TournamentType[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchTournaments = async () => {
			try {
				const response = await axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`)
				const tournamentsSorted = response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
				setTournaments(tournamentsSorted)
			} catch (error) {
				console.error('Error fetching tournaments:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchTournaments()
	}, [API_URL])

	if (loading) {
		return (
			<main className="p-4">
				<h1>{'Loading tournaments...'}</h1>
			</main>
		)
	}

	return (
		<main className="p-8 min-h-screen bg-gray-900">
			<h1 className="text-3xl font-bold mb-4 text-white">{'Tournaments'}</h1>
			<div className="space-y-4">
				{tournaments.map((tournament) => (
					<div key={tournament._id} className="bg-gray-800 rounded-lg shadow-xl p-3">
						<div className="text-gray-400 mb-2 text-sm" title={`Created: ${formatDate(tournament.createdAt)}`}>
							{formatDate(tournament.createdAt)}
							<span className="ml-2 text-gray-500" title="Tournament execution time">
								{'('}{formatDuration(tournament.tournamentExecutionTime)}{')\r'}
							</span>
						</div>

						<div className="grid grid-cols-[minmax(200px,35%)_minmax(250px,40%)_minmax(200px,25%)] gap-4">
							<WinnerDisplay winner={tournament.winners.first} />
							<div className="space-y-2">
								<RunnerUpDisplay place={2} winner={tournament.winners.second} />
								<RunnerUpDisplay place={3} winner={tournament.winners.third} />
							</div>
							<StatsDisplay statistics={tournament.statistics} />
						</div>
					</div>
				))}
			</div>
			{tournaments.length === 0 && !loading && (
				<p className="text-white text-center mt-4">{'No tournaments found.'}</p>
			)}
		</main>
	)
}
