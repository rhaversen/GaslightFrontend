'use client'

import { useUser } from '@/contexts/UserProvider'
import { type UserType, type ISubmission } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'
import { StrategyCard } from '@/components/StrategyCard'

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
			<main className="container mx-auto p-6 max-w-4xl">
				<div className="bg-white shadow-lg rounded-lg p-6">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
						<div className="space-y-4">
							<div className="h-24 bg-gray-200 rounded"></div>
							<div className="h-24 bg-gray-200 rounded"></div>
						</div>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto p-6 max-w-4xl">
				<div className="shadow-lg rounded-2xl p-8">
					<div className="flex items-center mb-8">
						<Link
							href={`/user/${params.userId}`}
							className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105 min-w-[120px]"
						>
							<span className="inline-flex items-center">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
								</svg>
								{'Profile\r'}
							</span>
						</Link>
						<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 flex-1 text-center mx-4">
							{isOwnProfile ? 'Your Strategies' : `${username}'s Strategies`}
						</h1>
						<div className="min-w-[120px] flex justify-end">
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
			</div>
		</main>
	)
}
