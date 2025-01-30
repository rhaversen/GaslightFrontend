'use client'

import axios from 'axios'
import Link from 'next/link'
import React, { useState, useEffect, type ReactElement } from 'react'
import { TournamentType } from '@/types/backendDataTypes'
import { useUser } from '@/contexts/UserProvider'
import { TournamentCard } from './components/TournamentCard'
import { LatestTournamentCard } from './components/LatestTournamentCard'

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
					className="px-3 py-1.5 text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:border-gray-600"
				>
					{'←'}<span className="ml-2">{'Home'}</span>
				</Link>
				<h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300">
					{'Tournaments'}
				</h1>
			</div>
			<div className="space-y-6">
				{tournaments.map((tournament, index) => (
					index === 0 
						? <LatestTournamentCard 
							key={tournament._id} 
							tournament={tournament} 
							currentUserId={currentUser?._id} 
						/>
						: <TournamentCard 
							key={tournament._id} 
							tournament={tournament} 
							currentUserId={currentUser?._id} 
						/>
				))}
			</div>
			{
				tournaments.length === 0 && !loading && (
					<p className="text-white text-center mt-4">{'No tournaments found.'}</p>
				)
			}
		</main >
	)
}
