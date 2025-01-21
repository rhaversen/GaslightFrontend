'use client'

import { useUser } from '@/contexts/UserProvider'
import { type ISubmission } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const defaultCode = `const main = (api: MeyerStrategyAPI) => {
	// If we're first in the round, we need to roll
	if (api.isFirstInRound()) {
		api.roll()
		return
	}

	// Randomly reveal
	if (Math.random() > 0.5) {
		api.reveal()
		return
	}

	// Get previous announced value
	const lastScore = api.getPreviousAction()

	// Roll the dice
	const currentScore = api.roll()

	// If our score is higher or equal, finish the turn
	if (lastScore === null || currentScore >= lastScore) {
		return
	}

	// If our score is lower, we can either lie or call "det eller derover"
	if (Math.random() > 0.5) {
		api.lie(lastScore)
	} else {
		api.detEllerDerover()
	}
}

export default main
`

export default function Page ({ params }: Readonly<{ params: { userId: string } }>): ReactElement {
	const { currentUser } = useUser()
	const [strategies, setStrategies] = useState<ISubmission[]>([])
	const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null)
	const isOwnProfile = currentUser?._id === params.userId
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)

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
				console.log('Strategies:', response.data)
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

	const createNewStrategy = async (): Promise<void> => {
		try {
			const response = await axios.post<ISubmission>(
				`${API_URL}/v1/submissions`,
				{
					title: 'New Strategy',
					code: defaultCode
				},
				{ withCredentials: true }
			)
			console.log('Created strategy:', response.data)
			router.push(`/user/${params.userId}/strategies/${response.data._id}`)
		} catch (error) {
			console.error('Error creating strategy:', error)
		}
	}

	const toggleActive = async (strategyId: string, active: boolean): Promise<void> => {
		console.log('Toggling active status:', strategyId, active)

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
		<main className="container mx-auto p-6 max-w-4xl">
			<div className="bg-white shadow-lg rounded-lg p-6">
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-4">
						<Link
							href={`/user/${params.userId}`}
							className="text-gray-600 hover:text-gray-800 transition-colors"
						>
							<span className="inline-flex items-center">
								<svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
								</svg>
								{'Back to Profile\r'}
							</span>
						</Link>
						<h1 className="text-3xl font-bold text-gray-800">{'Strategies'}</h1>
					</div>
					{isOwnProfile && (
						<button
							className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
							onClick={() => { void createNewStrategy() }}
						>
							{'Create New Strategy\r'}
						</button>
					)}
				</div>
				<div className="grid gap-4">
					{strategies.map((strategy) => (
						<div key={strategy._id} className="border rounded-lg p-4 hover:bg-gray-50">
							<div className="flex justify-between items-center">
								<Link href={`/user/${params.userId}/strategies/${strategy._id}`}>
									<h3 className="text-xl font-semibold text-gray-800">{strategy.title}</h3>
								</Link>
								<div className="flex items-center space-x-4">
									{isOwnProfile && (
										<label className={`flex items-center space-x-2 ${activeStrategyId !== null && activeStrategyId !== strategy._id ? 'opacity-50' : ''
										}`}>
											<input
												type="checkbox"
												checked={strategy.active}
												onChange={(e) => { void (async () => { await toggleActive(strategy._id, e.target.checked) })() }}
												disabled={activeStrategyId !== null && activeStrategyId !== strategy._id}
												className="form-checkbox h-5 w-5 text-blue-600 disabled:text-gray-400"
											/>
											<span className="text-sm text-gray-600">{'Active'}</span>
										</label>
									)}
									<span className={`px-3 py-1 rounded-full text-sm ${strategy.passedEvaluation ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
									}`}>
										{strategy.passedEvaluation ? 'Passing' : 'Not Passing'}
									</span>
								</div>
							</div>
							<div className="mt-2 text-gray-600">
								<p>{'Lines of code: '}{strategy.loc}</p>
								<p>{'Last updated: '}{new Date(strategy.updatedAt).toLocaleDateString()}</p>
								<p>{'Created: '}{new Date(strategy.createdAt).toLocaleDateString()}</p>
								{strategy.evaluation != null && (
									<div className="mt-3 border-t pt-3">
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
												{'Execution: '}{strategy.evaluation.averageExecutionTime.toFixed(3)}{'ms\r'}
											</span>
											{(strategy.evaluation.disqualified != null) && (
												<span className="text-red-600">
													{'Disqualified: '}{strategy.evaluation.disqualified}
												</span>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	)
}
