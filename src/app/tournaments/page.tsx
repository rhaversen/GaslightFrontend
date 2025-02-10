'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { HomeIcon } from '@/lib/icons'
import { useUser } from '@/contexts/UserProvider'
import { GameType } from '@/types/backendDataTypes'
import LatestTournaments from './components/LatestTournaments'
import SingleGameTournaments from './components/SingleGameTournaments'

export default function Page() {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const searchParams = useSearchParams()
	const router = useRouter()
	const { currentUser } = useUser()
	const [selectedGame, setSelectedGame] = useState<string>(searchParams.get('game') ?? '')
	const [games, setGames] = useState<GameType[]>([])

	// Fetch available games
	useEffect(() => {
		axios.get<GameType[]>(`${API_URL}/v1/games`)
			.then(response => {
				setGames(response.data)
				if (selectedGame && !response.data.find(g => g._id === selectedGame)) {
					setSelectedGame('')
					router.replace('/tournaments')
				}
			})
			.catch(error => console.error('Error fetching games:', error))
	}, [API_URL, router, selectedGame])

	const handleGameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const gameId = event.target.value
		setSelectedGame(gameId)
		if (gameId) {
			router.push(`/tournaments?game=${gameId}`)
		} else {
			router.push('/tournaments')
		}
	}

	return (
		<main className="p-2 sm:p-4 md:p-8 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
				<div className="flex items-center gap-4">
					<Link
						href="/"
						className="p-2 text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:border-gray-600 flex items-center gap-2"
						aria-label="Go to home page"
					>
						<HomeIcon />
					</Link>
					<h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300">
						{'Tournaments\r'}
					</h1>
				</div>
				<div className="w-full sm:w-auto sm:ml-auto">
					<select
						value={selectedGame}
						onChange={handleGameChange}
						aria-label="Select game"
						className="w-full sm:w-64 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">{'All Games'}</option>
						{games.map(game => (
							<option key={game._id} value={game._id}>
								{game.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Render tournaments based on game selection */}
			{selectedGame && games.length > 0 ? (
				<SingleGameTournaments
					game={games.find(g => g._id === selectedGame)!}
					API_URL={API_URL}
					currentUser={currentUser}
				/>
			) : (
				<LatestTournaments
					games={games}
					API_URL={API_URL}
					currentUser={currentUser}
				/>
			)}
		</main>
	)
}
