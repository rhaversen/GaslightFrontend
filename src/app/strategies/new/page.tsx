'use client'
import React, { useState, useEffect, ReactElement } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/contexts/UserProvider'
import { GameType } from '@/types/backendDataTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function NewStrategy(): ReactElement<any> {
	const router = useRouter()
	const searchParams = useSearchParams()
	const gameParam = searchParams.get('game')
	const { currentUser } = useUser()
	const [title, setTitle] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')
	const [games, setGames] = useState<any[]>([])
	const [selectedGame, setSelectedGame] = useState<any>(null)
	const [strategyCode, setStrategyCode] = useState<string>('')

	useEffect(() => {
		axios.get<GameType[]>(`${API_URL}/v1/games`, { withCredentials: true })
			.then(response => {
				setGames(response.data)
				if (response.data.length > 0) {
					const preselectedGame = gameParam !== null
						? response.data.find(g => g._id === gameParam)
						: response.data[0]
					
					if (preselectedGame) {
						setSelectedGame(preselectedGame)
						setStrategyCode(preselectedGame.exampleStrategy)
					}
				}
			})
			.catch(err => console.error('Error fetching games:', err))
	}, [gameParam])

	const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const gameId = e.target.value
		const game = games.find(g => g._id === gameId)
		setSelectedGame(game)
		setStrategyCode(game.exampleStrategy)
	}

	const handleCreate = async (): Promise<void> => {
		if (title.trim() === '' || selectedGame === null) {
			return
		}

		setIsSubmitting(true)
		setError('')

		try {
			const response = await axios.post(
				`${API_URL}/v1/submissions`,
				{ title, code: strategyCode, game: selectedGame._id },
				{ withCredentials: true }
			)
			router.push(`/strategies/${response.data._id}/edit`)
		} catch (error) {
			console.error('Error creating strategy:', error)
			setError('Failed to create strategy. Please try again.')
			setIsSubmitting(false)
		}
	}

	return (
		<main className="container mx-auto max-w-4xl p-6">
			<div className="flex flex-wrap items-center justify-between gap-4 m-8">
				<button
					onClick={() => router.push(`/users/${currentUser?._id}/strategies`)}
					className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105"
				>
					<span className="inline-flex items-center">
						<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
						</svg>
						{'Back\r'}
					</span>
				</button>
				<h1 className="w-full sm:w-auto sm:flex-1 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center order-last sm:order-none pb-2">
					{'Create Strategy\r'}
				</h1>
				<div className="w-[100px]"></div>
			</div>

			<div className="space-y-8">
				<div>
					<label htmlFor="game" className="block text-sm font-medium text-gray-700 mb-2">
						{'Select Game\r'}
					</label>
					<select
						id="game"
						className="w-full p-4 border border-gray-200 text-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
						onChange={handleGameChange}
						value={selectedGame !== null ? selectedGame._id : ''}
					>
						{games.map(game => (
							<option key={game._id} value={game._id}>
								{game.name}
							</option>
						))}
					</select>
				</div>

				<div>
					<label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
						{'Strategy Title\r'}
					</label>
					<input
						id="title"
						type="text"
						className="w-full p-4 border border-gray-200 text-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
						value={title}
						onChange={(e) => { setTitle(e.target.value) }}
						onKeyDown={(e) => { if (e.key === 'Enter') { void handleCreate() } }}
						placeholder="Enter a title for your strategy"
					/>
				</div>

				{error.length > 0 && (
					<div className="text-red-500 text-sm bg-red-50 p-4 rounded-lg border border-red-100">
						{error}
					</div>
				)}

				<div className="flex items-center gap-4">
					<button
						onClick={() => { void handleCreate() }}
						disabled={isSubmitting || title.trim().length === 0 || selectedGame === null}
						className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100"
					>
						{isSubmitting ? 'Creating...' : 'Create Strategy'}
					</button>
					<button
						onClick={() => router.push(`/users/${currentUser?._id}/strategies`)}
						className="text-gray-600 hover:text-gray-900 transition-colors"
					>
						{'Cancel\r'}
					</button>
				</div>
			</div>
		</main>
	)
}
