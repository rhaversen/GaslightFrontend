'use client'

import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState, use } from 'react'

import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import { StrategyCard } from '@/components/StrategyCard'
import { useUser } from '@/contexts/UserProvider'
import { type UserType, type SubmissionType, type GameType } from '@/types/backendDataTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page (props: { params: Promise<{ userId: string }> }): ReactElement<any> {
	const params = use(props.params)
	const { currentUser } = useUser()
	const [strategies, setStrategies] = useState<SubmissionType[]>([])
	const [activeStrategies, setActiveStrategies] = useState<{ [gameId: string]: string | null }>({})
	const [username, setUsername] = useState<string>('')
	const isOwnProfile = currentUser?._id === params.userId
	const [isLoading, setIsLoading] = useState(true)
	// State for games and selected game
	const [games, setGames] = useState<GameType[]>([])
	const [selectedGame, setSelectedGame] = useState<GameType | null>(null)

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			setIsLoading(true)
			try {
				const [strategiesResponse, userResponse, gamesResponse] = await Promise.all([
					axios.get<SubmissionType[]>(`${API_URL}/v1/submissions`, {
						params: { user: params.userId },
						withCredentials: true
					}),
					axios.get<UserType>(`${API_URL}/v1/users/${params.userId}`, {
						withCredentials: true
					}),
					axios.get<GameType[]>(`${API_URL}/v1/games`, {
						withCredentials: true
					})
				])

				setStrategies(strategiesResponse.data)
				setUsername(userResponse.data.username ?? 'Unknown User')
				setGames(gamesResponse.data)
				if (gamesResponse.data.length > 0) {
					setSelectedGame(gamesResponse.data[0])
				}

				// Compute active strategies per game
				const activeMap: { [gameId: string]: string | null } = {}
				for (const strat of strategiesResponse.data) {
					if (strat.active && !activeMap.hasOwnProperty(strat.game)) {
						activeMap[strat.game] = strat._id
					}
				}
				setActiveStrategies(activeMap)
			} catch (error) {
				console.error('Error fetching data:', error)
				setUsername('Unknown User')
			} finally {
				setIsLoading(false)
			}
		}
		void fetchData()
	}, [params.userId])

	// Handler for game selection remains unchanged
	const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const gameId = e.target.value
		const game = games.find(g => g._id === gameId)
		setSelectedGame(game ?? null)
	}

	const filteredStrategies = selectedGame
		? strategies.filter(strategy => strategy.game === selectedGame._id)
		: strategies

	const toggleActive = async (strategyId: string, active: boolean): Promise<void> => {
		// Find the strategy to get its game ID
		const strat = strategies.find(s => s._id === strategyId)
		if (!strat) { return }
		const gameId = strat.game
		const previousActiveId = activeStrategies[gameId] ?? null

		// Optimistic update for the specific game
		setActiveStrategies(prev => ({ ...prev, [gameId]: active ? strategyId : null }))
		setStrategies(prev => prev.map(strategy => {
			if (strategy.game === gameId) {
				if (strategy._id === strategyId) {
					return { ...strategy, active }
				}
				if (strategy._id === previousActiveId) {
					return { ...strategy, active: false }
				}
			}
			return strategy
		}))

		try {
			await axios.patch<SubmissionType>(
				`${API_URL}/v1/submissions/${strategyId}`,
				{ active },
				{ withCredentials: true }
			)
		} catch (error) {
			console.error('Error toggling active status:', error)
			// Revert to previous state on error
			setActiveStrategies(prev => ({ ...prev, [gameId]: previousActiveId }))
			setStrategies(prev => prev.map(strategy => {
				if (strategy.game === gameId) {
					if (strategy._id === strategyId) {
						return { ...strategy, active: !active }
					}
					if (strategy._id === previousActiveId) {
						return { ...strategy, active: true }
					}
				}
				return strategy
			}))
		}
	}

	const handleDelete = async (strategy: SubmissionType): Promise<void> => {
		if (!window.confirm(`Are you sure you want to delete "${strategy.title}"? It cannot be recovered.`)) {
			return
		}

		try {
			await axios.delete(`${API_URL}/v1/submissions/${strategy._id}`, {
				withCredentials: true
			})
			setStrategies(prev => prev.filter(s => s._id !== strategy._id))
		} catch (error) {
			console.error('Error deleting strategy:', error)
		}
	}

	const handleEvaluate = async (strategyId: string): Promise<void> => {
		try {
			const { data: updatedStrategy } = await axios.post<SubmissionType>(
				`${API_URL}/v1/submissions/${strategyId}/evaluate`,
				{},
				{ withCredentials: true }
			)
			setStrategies(prev => prev.map(strategy =>
				strategy._id === strategyId ? updatedStrategy : strategy
			))
		} catch (error) {
			console.error('Error evaluating strategy:', error)
		}
	}

	if (isLoading) {
		return (
			<div className="w-full flex justify-center">
				<div className="w-1/2 p-5">
					<LoadingPlaceholder />
				</div>
			</div>
		)
	}

	return (
		<main className="container mx-auto max-w-4xl p-2">
			<div className="flex flex-wrap items-center justify-between gap-4 m-8">
				<div className="flex justify-start w-20" /> {/* Placeholder for alignment */}
				<h1 className="w-full sm:w-auto sm:flex-1 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center order-last sm:order-none pb-2">
					{isOwnProfile ? 'Your Strategies' : `${username}'s Strategies`}
				</h1>
				<div className="flex justify-end w-20">
					{isOwnProfile && (
						<Link
							href={`/strategies/new?game=${selectedGame?._id}`}
							className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition-all shadow-md whitespace-nowrap"
						>
							{'Create Strategy'}
						</Link>
					)}
				</div>
			</div>

			{/* UI for selecting a game */}
			{games.length > 0 && (
				<div className="mb-4">
					<label htmlFor="game" className="block text-sm font-medium text-gray-700 mb-2">
						{'Select Game'}
					</label>
					<select
						id="game"
						className="w-full p-4 border border-gray-200 text-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
						value={selectedGame ? selectedGame._id : ''}
						onChange={handleGameChange}
					>
						{games.map(game => (
							<option key={game._id} value={game._id}>
								{game.name}
							</option>
						))}
					</select>
				</div>
			)}
			{/* Display active strategy for the selected game */}
			{selectedGame && activeStrategies[selectedGame._id] !== null && activeStrategies[selectedGame._id] !== undefined
				? (
					<div className="mb-4 p-4 border bg-white rounded-lg">
						<p className="text-gray-700 text-sm text-center">
							{'Currently active strategy: '}
							<span className="font-semibold">
								{
									strategies.find(s => s._id === activeStrategies[selectedGame._id])
										?.title ?? 'Unknown'
								}
							</span>
						</p>
					</div>
				)
				: (isOwnProfile
					? (
						<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-yellow-700 text-sm text-center">
								{'No strategy is currently active. Activate a strategy to enter the tournament.'}
							</p>
						</div>
					)
					: (
						<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-yellow-700 text-sm text-center">
								{'This user has no active strategy.'}
							</p>
						</div>
					)
				)
			}

			{/* Display filtered strategies */}
			{filteredStrategies.length === 0 ? (
				isOwnProfile ? (
					<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-blue-700 text-center">
							{'No strategies found for the selected game.'}
						</p>
					</div>
				) : (
					<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
						<p className="text-yellow-700 text-center">
							{'This user has no strategies for the selected game.'}
						</p>
					</div>
				)
			) : (
				<div className="space-y-4">
					{filteredStrategies.map((strategy) => (
						<StrategyCard
							key={strategy._id}
							strategy={strategy}
							isOwnProfile={isOwnProfile}
							onToggleActive={toggleActive}
							onDelete={handleDelete}
							activeStrategyId={activeStrategies[strategy.game] ?? null}
							onEvaluate={handleEvaluate}
						/>
					))}
				</div>
			)}
		</main>
	)
}
