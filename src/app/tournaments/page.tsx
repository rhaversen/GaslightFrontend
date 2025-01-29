'use client'

import axios from 'axios'
import Link from 'next/link'
import React, { useState, useEffect, type ReactElement } from 'react'
import { TournamentType } from '@/types/backendDataTypes'
import { formatDate } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/timeUtils'
import { WinnerDisplay } from './components/WinnerDisplay'
import { StatsDisplay } from './components/StatsDisplay'
import { RunnerUpDisplay } from './components/RunnersUp'
import { useUser } from '@/contexts/UserProvider'

export default function Page(): ReactElement<any> {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [tournaments, setTournaments] = useState<TournamentType[]>([])
	const [loading, setLoading] = useState(true)
	const { currentUser } = useUser()

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
		<main className="p-2 sm:p-4 md:p-8 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<div className="flex items-center gap-4 mb-6">
				<Link
					href="/"
					className="px-3 py-1.5 text-sm font-medium text-gray-300 
						border border-gray-700 rounded-lg
						hover:bg-gray-800 transition-all duration-300
						hover:border-gray-600"
				>
					{'←'}<span className="ml-2">{'Home'}</span>
				</Link>
				<h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300">
					{'Tournaments'}
				</h1>
			</div>
			<div className="space-y-6">
				{tournaments.map((tournament) => (
					<div key={tournament._id} 
						className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-4 
							border border-gray-700/30 backdrop-blur-sm">
						<div className="text-gray-400 mb-3 text-sm font-medium flex justify-between items-start">
							<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
								<div className="flex items-center gap-2">
									<span title={`Created: ${formatDate(tournament.createdAt)}`}>
										{formatDate(tournament.createdAt)}
									</span>
									<span className="text-gray-500/80" title="Tournament execution time">
										{'('}{formatDuration(tournament.tournamentExecutionTime)}{')'}
									</span>
								</div>
								<span className="text-gray-500/80" title="Number of submissions">
									{tournament.gradings.length}{' submissions'}
								</span>
							</div>
							<button
								onClick={() => console.log('Navigate to tournament:', tournament._id)}
								className="px-3 py-1 text-xs font-medium text-indigo-300 
									border border-indigo-500/30 rounded-lg
									hover:bg-indigo-500/10 transition-all duration-300
									hover:border-indigo-500/50"
							>
								{'View Details →'}
							</button>
						</div>
						
						<div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,400px)_minmax(300px,400px)_1fr] gap-2">
							<WinnerDisplay winner={tournament.standings[0]} />
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
								<RunnerUpDisplay place={2} winner={tournament.standings[1]} />
								<RunnerUpDisplay place={3} winner={tournament.standings[2]} />
							</div>
							<StatsDisplay 
								statistics={tournament.statistics} 
								userGrade={tournament.standings.find(s => s.user === currentUser?._id)?.grade}
							/>
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
