'use client'

import { type ISubmission } from '@/types/backendDataTypes'
import MonacoEditor from '@/components/MonacoEditor'
import axios from 'axios'
import React, { type ReactElement, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import EvaluationResults from '@/components/EvaluationResults'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page ({ params }: Readonly<{
	params: { userId: string, strategyId: string }
}>): ReactElement {
	const router = useRouter()
	const [strategy, setStrategy] = useState<ISubmission | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)
	const [originalStrategy, setOriginalStrategy] = useState<ISubmission | null>(null)
	const didPushRef = React.useRef(false)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			setIsLoading(true)
			try {
				const response = await axios.get<ISubmission>(
					`${API_URL}/v1/submissions/${params.strategyId}`,
					{ withCredentials: true }
				)
				setStrategy(response.data)
				setOriginalStrategy(response.data)
				setHasChanges(false)
			} catch (error) {
				console.error('Error fetching data:', error)
			} finally {
				setIsLoading(false)
			}
		}
		void fetchData()
	}, [params.strategyId, params.userId])

	// Add change detection
	useEffect(() => {
		if (strategy == null || originalStrategy == null) {
			setHasChanges(false)
			return
		}

		const hasChanges =
			strategy.title !== originalStrategy.title ||
			strategy.code !== originalStrategy.code

		setHasChanges(hasChanges)
	}, [strategy, originalStrategy])

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
			if (hasChanges) {
				e.preventDefault()
				return 'You have unsaved changes. Are you sure you want to leave?'
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [hasChanges])

	// Navigation blocking effect
	useEffect(() => {
		if (!hasChanges) {
			didPushRef.current = false
			return
		}

		// Push to history only once
		if (!didPushRef.current) {
			window.history.pushState(null, '', window.location.href)
			didPushRef.current = true
		}

		const handlePopState = (e: PopStateEvent): void => {
			e.preventDefault()
			if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
				setHasChanges(false)
				window.removeEventListener('popstate', handlePopState)
				window.history.go(-1)
			} else {
				window.history.pushState(null, '', window.location.href)
			}
		}

		window.addEventListener('popstate', handlePopState)
		return () => {
			window.removeEventListener('popstate', handlePopState)
		}
	}, [hasChanges])

	// Link navigation handler
	const handleNavigateAway = (e: React.MouseEvent): void => {
		if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
			e.preventDefault()
		}
	}

	const handleSubmit = (): void => {
		if (strategy == null) return
		setIsSubmitting(true)

		axios.patch<ISubmission>(
			`${API_URL}/v1/submissions/${params.strategyId}`,
			strategy,
			{ withCredentials: true }
		).then(response => {
			setStrategy(response.data)
			setOriginalStrategy(response.data)
			setHasChanges(false)
		}).catch(error => {
			console.error('Error updating strategy:', error)
		}).finally(() => {
			setIsSubmitting(false)
		})
	}

	const handleDelete = async (): Promise<void> => {
		if (!window.confirm('Are you sure you want to delete this strategy? It cannot be recovered.')) {
			return
		}

		try {
			await axios.delete(`${API_URL}/v1/submissions/${params.strategyId}`, {
				withCredentials: true
			})
			router.push(`/users/${params.userId}/strategies`)
		} catch (error) {
			console.error('Error deleting strategy:', error)
		}
	}

	if (isLoading) {
		return <LoadingPlaceholder />
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-4xl p-2">
				<div className="flex flex-wrap items-center justify-between gap-4 m-8">
					<Link
						href={`/users/${params.userId}/strategies`}
						onClick={handleNavigateAway}
						className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105"
					>
						<span className="inline-flex items-center">
							<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
							</svg>
							{'Back'}
						</span>
					</Link>
					<h1 className="w-full sm:w-auto sm:flex-1 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center order-last sm:order-none pb-2">
						{'Strategy Details'}
					</h1>
					<div className="w-[120px] flex justify-end">
						<button
							type="button"
							onClick={() => { void handleDelete() }}
							className="text-red-500 hover:text-red-600 transition-all hover:scale-105 flex items-center gap-2"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							{'Delete'}
						</button>
					</div>
				</div>
				{strategy != null && (
					<div className="space-y-8">
						<div className="flex flex-col gap-6">
							<input
								type="text"
								value={strategy.title}
								onChange={(e) => { setStrategy({ ...strategy, title: e.target.value }) }}
								className="w-full p-4 text-2xl text-gray-800 font-semibold bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none transition-all"
								placeholder="Enter strategy title..."
							/>

							<div className="flex items-center gap-4 flex-wrap">
								{(hasChanges || strategy.passedEvaluation === null) && (
									<>
										<button
											type='button'
											onClick={() => { handleSubmit() }}
											disabled={isSubmitting}
											className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100"
										>
											{isSubmitting ? 'Submitting...' : 'Submit'}
										</button>
										{((strategy.passedEvaluation !== null) || hasChanges) && !isSubmitting && (
											<button
												type='button'
												onClick={() => {
													if (hasChanges && !confirm('You have unsaved changes. Discard them?')) {
														return
													}
													if (originalStrategy != null) {
														setStrategy(originalStrategy)
														setHasChanges(false)
													}
												}}
												className="bg-gray-100 text-gray-600 px-8 py-3 rounded-lg hover:bg-gray-200 hover:scale-105 transition-all"
											>
												{'Cancel\r'}
											</button>
										)}
									</>
								)}

								{!isSubmitting && (
									<span className={`px-4 py-2 rounded-lg text-sm font-medium ${strategy.passedEvaluation === null
										? 'bg-yellow-100 text-yellow-800'
										: strategy.passedEvaluation
											? 'bg-green-100 text-green-800'
											: 'bg-red-100 text-red-800'
									}`}>
										{strategy.passedEvaluation === null
											? 'Not Evaluated'
											: strategy.passedEvaluation
												? 'Passed Evaluation'
												: 'Failed Evaluation'}
									</span>
								)}
							</div>
							<EvaluationResults
								strategy={strategy}
							/>
						</div>

						<div className="rounded-xl overflow-hidden shadow-sm relative">
							<MonacoEditor
								value={strategy?.code ?? ''}
								onChange={(value) => {
									if (value !== undefined) {
										setStrategy({ ...strategy, code: value })
									}
								}}
							/>
						</div>
					</div>
				)}
			</div>
		</main>
	)
}
