'use client'

import { useUser } from '@/contexts/UserProvider'
import { type UserType, type ISubmission } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'
import { StrategyCard } from '@/components/StrategyCard'
import LoadingPlaceholder from '@/components/LoadingPlaceholder'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page ({ params }: Readonly<{ params: { userId: string } }>): ReactElement {
	const { currentUser } = useUser()
	const [strategies, setStrategies] = useState<ISubmission[]>([])
	const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null)
	const [username, setUsername] = useState<string>('')
	const isOwnProfile = currentUser?._id === params.userId
	const [isLoading, setIsLoading] = useState(true)

	const isEvaluationRecent = (evaluation: ISubmission['evaluation']): boolean => {
		const daysBeforeStale = 7
		try {
			if (evaluation.updatedAt == null) return false

			const evaluationDate = new Date(evaluation.updatedAt)
			if (isNaN(evaluationDate.getTime())) return false

			const oneWeekAgo = new Date()
			oneWeekAgo.setDate(oneWeekAgo.getDate() - daysBeforeStale)
			oneWeekAgo.setHours(0, 0, 0, 0) // normalize to start of day

			const evalDateNormalized = new Date(evaluationDate)
			evalDateNormalized.setHours(0, 0, 0, 0) // normalize to start of day

			return evalDateNormalized >= oneWeekAgo
		} catch {
			return false
		}
	}

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			setIsLoading(true)
			try {
				const [strategiesResponse, userResponse] = await Promise.all([
					axios.get<ISubmission[]>(`${API_URL}/v1/submissions`, {
						params: { user: params.userId },
						withCredentials: true
					}),
					axios.get<UserType>(`${API_URL}/v1/users/${params.userId}`, {
						withCredentials: true
					})
				])

				setStrategies(strategiesResponse.data)
				setUsername(userResponse.data.username ?? 'Unknown User')

				// Set active strategy ID
				const activeStrategy = strategiesResponse.data.find(s => s.active)
				setActiveStrategyId(activeStrategy?._id ?? null)
			} catch (error) {
				console.error('Error fetching data:', error)
				setUsername('Unknown User')
			} finally {
				setIsLoading(false)
			}
		}
		void fetchData()
	}, [params.userId])

	const toggleActive = async (strategyId: string, active: boolean): Promise<void> => {
		// Store previous state
		const previousActiveId = activeStrategyId

		// Optimistic update
		setActiveStrategyId(active ? strategyId : null)
		setStrategies(prev => prev.map(strategy => {
			if (strategy._id === strategyId) {
				return { ...strategy, active }
			}
			if (strategy._id === previousActiveId) {
				return { ...strategy, active: false }
			}
			return strategy
		}))

		try {
			await axios.patch<ISubmission>(
				`${API_URL}/v1/submissions/${strategyId}`,
				{ active },
				{ withCredentials: true }
			)
		} catch (error) {
			console.error('Error toggling active status:', error)
			// Revert to previous state on error
			setActiveStrategyId(previousActiveId)
			setStrategies(prev => prev.map(strategy => {
				if (strategy._id === strategyId) {
					return { ...strategy, active: !active }
				}
				if (strategy._id === previousActiveId) {
					return { ...strategy, active: true }
				}
				return strategy
			}))
		}
	}

	const handleDelete = async (strategy: ISubmission): Promise<void> => {
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
			const { data: updatedStrategy } = await axios.post<ISubmission>(
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
			<LoadingPlaceholder />
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-4xl p-2">
				<div className="flex flex-wrap items-center justify-between gap-4 m-8">
					<Link
						href={`/user/${params.userId}`}
						className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105"
					>
						<span className="inline-flex items-center">
							<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
							</svg>
							{'Profile'}
						</span>
					</Link>
					<h1 className="w-full sm:w-auto sm:flex-1 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center order-last sm:order-none pb-2">
						{isOwnProfile ? 'Your Strategies' : `${username}'s Strategies`}
					</h1>
					<div className="flex justify-end">
						{isOwnProfile && (
							<Link
								href={`/user/${params.userId}/strategies/new`}
								className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition-all shadow-md whitespace-nowrap"
							>
								{'Create Strategy'}
							</Link>
						)}
					</div>
				</div>
				{strategies.length === 0 && (
					isOwnProfile
						? (
							<div className="mb-4 p-4 flex flex-col gap-5 items-center bg-blue-50 border border-blue-200 rounded-lg">
								<p className="text-blue-700 text-center">
									{'You currently have no strategies.'}
								</p>
								<div className="flex items-center gap-1">
									<Link
										href={`/user/${params.userId}/strategies/new`}
										className="bg-gradient-to-r text-center from-blue-500 to-purple-500 text-white px-2 py-1 m-1 rounded-lg hover:scale-105 transition-all shadow-md whitespace-nowrap"
									>
										{'Create a new strategy'}
									</Link>

									<p className="text-blue-700 text-center">
										{'to get started.'}
									</p>
								</div>
							</div>
						)
						: (
							<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
								<p className="text-yellow-700 text-center">
									{'This user currently has no strategies.'}
								</p>
							</div>
						)
				)}
				{strategies.length > 0 && (
					activeStrategyId !== null
						? (
							<div className="mb-4 p-4 border bg-white rounded-lg">
								<p className="text-gray-700 text-sm text-center">
									{'Currently active strategy: '}<span className="font-semibold">
										{strategies.find(s => s._id === activeStrategyId)?.title ?? 'Unknown'}
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
				)}
				<div className="space-y-4">
					{strategies.map((strategy) => (
						<StrategyCard
							key={strategy._id}
							strategy={strategy}
							isOwnProfile={isOwnProfile}
							userId={params.userId}
							onToggleActive={toggleActive}
							onDelete={handleDelete}
							activeStrategyId={activeStrategyId}
							isEvaluationRecent={isEvaluationRecent}
							onEvaluate={handleEvaluate}
						/>
					))}
				</div>
			</div>
		</main>
	)
}
