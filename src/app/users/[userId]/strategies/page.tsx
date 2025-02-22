'use client'

import { useUser } from '@/contexts/UserProvider'
import { type UserType, type SubmissionType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState, use } from 'react'
import { StrategyCard } from '@/components/StrategyCard'
import LoadingPlaceholder from '@/components/LoadingPlaceholder'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page(props: { params: Promise<{ userId: string }> }): ReactElement<any> {
	const params = use(props.params)
	const { currentUser } = useUser()
	const [strategies, setStrategies] = useState<SubmissionType[]>([])
	const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null)
	const [username, setUsername] = useState<string>('')
	const isOwnProfile = currentUser?._id === params.userId
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			setIsLoading(true)
			try {
				const [strategiesResponse, userResponse] = await Promise.all([
					axios.get<SubmissionType[]>(`${API_URL}/v1/submissions`, {
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
			await axios.patch<SubmissionType>(
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
				<div className="flex justify-start w-20"/> {/* Placeholder for alignment */}
				<h1 className="w-full sm:w-auto sm:flex-1 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center order-last sm:order-none pb-2">
					{isOwnProfile ? 'Your Strategies' : `${username}'s Strategies`}
				</h1>
				<div className="flex justify-end w-20">
					{isOwnProfile && (
						<Link
							href="/strategies/new"
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
									href="/strategies/new"
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
						onToggleActive={toggleActive}
						onDelete={handleDelete}
						activeStrategyId={activeStrategyId}
						onEvaluate={handleEvaluate}
					/>
				))}
			</div>
		</main>
	)
}
