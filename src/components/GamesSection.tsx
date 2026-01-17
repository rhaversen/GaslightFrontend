'use client'

import axios from 'axios'
import Link from 'next/link'
import React, { useState, useEffect, type ReactElement } from 'react'

import type { GameType } from '@/types/backendDataTypes'

export default function GamesSection (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [games, setGames] = useState<GameType[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		axios.get<GameType[]>(`${API_URL}/v1/games`)
			.then(response => {
				setGames(response.data)
			})
			.catch(error => console.error('Error fetching games:', error))
			.finally(() => setLoading(false))
	}, [API_URL])

	return (
		<div className="p-5 m-5 backdrop-blur-sm bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl sm:p-4 flex justify-between items-center shadow-lg">
			{loading ? (
				<div className="animate-pulse bg-gray-800 rounded-3xl p-6" role="status" aria-label="Loading games" />
			) : (
				games.length > 0 ? (
					games.map(game => (
						<Link
							key={game._id}
							className="w-72 h-72 flex flex-row border-2 m-2 rounded-3xl border-white transition duration-300 hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-105"
							href={`/games/${game._id}`}
						>
							<div className="flex flex-col gap-4 p-5">
								<h3 className="text-2xl font-bold text-center">{game.name}</h3>
								<p className="text-base font-semibold">{game.summary}</p>
							</div>
						</Link>
					))
				) : (
					<p className="text-white">{'No games available.'}</p>
				)
			)}
		</div>
	)
}
