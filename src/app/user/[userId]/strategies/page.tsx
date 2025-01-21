'use client'

import { useUser } from '@/contexts/UserProvider'
import { type ISubmission } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page ({ params }: Readonly<{ params: { userId: string } }>): ReactElement {
	const { currentUser } = useUser()
	const [strategies, setStrategies] = useState<ISubmission[]>([])
	const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null)
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
		const fetchStrategies = async (): Promise<void> => {
			setIsLoading(true)
			try {
				const response = await axios.get<ISubmission[]>(
					`${API_URL}/v1/submissions`,
					{
						params: {
							user: params.userId
						},
						withCredentials: true
					}
				)
				setStrategies(response.data)
				// Set active strategy ID
				const activeStrategy = response.data.find(s => s.active)
				setActiveStrategyId(activeStrategy?._id ?? null)
			} catch (error) {
				console.error('Error fetching strategies:', error)
			} finally {
				setIsLoading(false)
			}
		}
		void fetchStrategies()
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
				<div className="backdrop-blur-sm bg-white/80 shadow-lg rounded-2xl p-8">
					<div className="flex items-center justify-between mb-8">
						<Link
							href={`/user/${params.userId}`}
							className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105"
						>
							<span className="inline-flex items-center">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
								</svg>
								{'Profile\r'}
							</span>
						</Link>
						<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
							{'Your Strategies\r'}
						</h1>
						{isOwnProfile && (
							<Link
								href={`/user/${params.userId}/strategies/new`}
								className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-all shadow-md"
							>
								{'Create Strategy\r'}
							</Link>
						)}
					</div>
					<div className="space-y-4">
						{strategies.map((strategy) => (
							<div key={strategy._id} className="flex">
								<Link
									href={`/user/${params.userId}/strategies/${strategy._id}`}
									className="flex-1 border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/50"
								>
									<div className="flex justify-between items-center">
										<h3 className="text-xl font-semibold text-gray-800 text-center">{strategy.title}</h3>
										<div className="flex items-center space-x-4">
											<span className={`px-3 py-1 rounded-full text-sm ${(strategy.passedEvaluation ?? false) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
												{(strategy.passedEvaluation ?? false) ? 'Passing' : 'Not Passing'}
											</span>
										</div>
									</div>
									<div className="mt-2 text-gray-600">
										<div className="flex justify-between items-end">
											<div>
												<p>{'Lines of code: '}{strategy.loc}</p>
												<p>{'Last updated: '}{new Date(strategy.updatedAt).toLocaleDateString()}</p>
												<p className="mb-0">{'Created: '}{new Date(strategy.createdAt).toLocaleDateString()}</p>
											</div>
										</div>
										{strategy.evaluation != null && isEvaluationRecent(strategy.evaluation) && (
											<div className="mt-3 border-t pt-3">
												{strategy.evaluation.disqualified != null
													? (
														<div className="text-red-600 mb-2 text-sm">
															{'Disqualified: '}{strategy.evaluation.disqualified}
														</div>
													)
													: (
														<div className="flex flex-wrap gap-4 text-sm">
															{(strategy.evaluation.results != null) && (
																<div className="flex gap-6">
																	<span>
																		{'Score: '}<span className="font-semibold">{strategy.evaluation.results.candidate.toFixed(2)}</span>
																	</span>
																	<span>
																		{'Avg: '}<span className="font-semibold">{strategy.evaluation.results.average.toFixed(2)}</span>
																	</span>
																</div>
															)}
															<span className={strategy.evaluation.executionTimeExceeded ? 'text-red-600' : 'text-green-600'}>
																{'Execution: '}{strategy.evaluation?.averageExecutionTime != null ? `${strategy.evaluation.averageExecutionTime.toFixed(3)} milliseconds` : 'N/A'}
															</span>
														</div>
													)}
											</div>
										)}
									</div>
								</Link>
								<div className="flex flex-col justify-start items-center ml-4 mt-6 space-y-4">
									{isOwnProfile && (
										<label
											className={`flex items-center space-x-2 ${
												(activeStrategyId !== null && activeStrategyId !== strategy._id) || !(strategy.passedEvaluation ?? false)
													? 'opacity-50'
													: ''
											}`}
											title={
												!(strategy.passedEvaluation ?? false)
													? 'Strategy must pass evaluation before it can be activated'
													: (activeStrategyId !== null && activeStrategyId !== strategy._id)
														? 'Only one strategy can be active at a time'
														: ''
											}
										>
											<input
												type="checkbox"
												checked={strategy.active}
												onChange={(e) => { void (async () => { await toggleActive(strategy._id, e.target.checked) })() }}
												disabled={(activeStrategyId !== null && activeStrategyId !== strategy._id) || !(strategy.passedEvaluation ?? false)}
												className="form-checkbox h-5 w-5 text-blue-600 disabled:text-gray-400"
											/>
											<span className="text-sm text-gray-600">{'Active'}</span>
										</label>
									)}
									{isOwnProfile && (
										<button
											onClick={() => { void handleDelete(strategy) }}
											className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
											title="Delete strategy"
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</main>
	)
}
