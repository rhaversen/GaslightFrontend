'use client'

import { type ISubmission } from '@/types/backendDataTypes'
import MonacoEditor from '@/components/MonacoEditor'
import axios from 'axios'
import React, { type ReactElement, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const createTimeBuckets = (
	times: number[]
): Array<{ range: string, count: number, min: number, max: number }> => {
	if (times.length === 0) return []

	const bucketSize = 0.001 // Fixed 0.001ms buckets
	const min = 0 // Always start from 0
	const max = Math.ceil(Math.max(...times) * 1000) / 1000

	// Calculate number of buckets needed
	const bucketCount = Math.ceil((max - min) / bucketSize)

	// Limit to prevent performance issues
	const maxBuckets = 200 // Increased max buckets since we're using smaller size
	const actualBucketCount = Math.min(bucketCount, maxBuckets)

	const buckets = Array.from({ length: actualBucketCount }, (_, i) => ({
		min: i * bucketSize,
		max: (i + 1) * bucketSize,
		count: 0,
		range: `${(i * bucketSize).toFixed(3)}` // Show 3 decimal places
	}))

	times.forEach(time => {
		const bucketIndex = Math.min(
			Math.floor(time / bucketSize),
			actualBucketCount - 1
		)
		buckets[bucketIndex].count++
	})

	return buckets
}

export default function Page ({ params }: Readonly<{
	params: { userId: string, strategyId: string }
}>): ReactElement {
	const router = useRouter()
	const [strategy, setStrategy] = useState<ISubmission | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)
	const [originalStrategy, setOriginalStrategy] = useState<ISubmission | null>(null)

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
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
			router.push(`/user/${params.userId}/strategies`)
		} catch (error) {
			console.error('Error deleting strategy:', error)
		}
	}

	const ExecutionTimeHistogram = ({ times }: { times: number[] }): ReactElement => {
		const buckets = useMemo(() => createTimeBuckets(times), [times])
		const maxCount = Math.max(...buckets.map(b => b.count))
		const svgHeight = 100
		const barWidth = 5
		const spacing = 1

		return (
			<div className="mt-4">
				<h4 className="text-sm font-medium mb-2">{'Execution Time Distribution (ms)'}</h4>
				<div className="relative overflow-x-auto pb-4 w-full">
					<div className="mx-auto w-full min-w-full">
						<svg className="w-full h-[120px]" preserveAspectRatio="xMidYMid meet">
							{buckets.map((bucket, i) => (
								<g key={i} className="group">
									<rect
										x={i * (barWidth + spacing)}
										y={svgHeight - (bucket.count / maxCount * svgHeight)}
										width={barWidth}
										height={bucket.count / maxCount * svgHeight === 0 ? 1 : bucket.count / maxCount * svgHeight}
										className="fill-blue-400 hover:fill-blue-500 transition-colors"
									/>
									{i % 5 === 0 && (
										<text
											x={i * (barWidth + spacing) + barWidth / 2}
											y={svgHeight + 15}
											textAnchor="middle"
											className="text-[8px] fill-gray-500"
											transform={`rotate(45, ${i * (barWidth + spacing) + barWidth / 2}, ${svgHeight + 15})`}
										>
											{bucket.range}
										</text>
									)}
									<title>{`${bucket.range}ms: ${bucket.count} executions`}</title>
								</g>
							))}
						</svg>
					</div>
				</div>
			</div>
		)
	}

	const renderEvaluationResults = (): ReactElement | null => {
		if (strategy?.evaluation === undefined) return null

		const LOADING_TIME_LIMIT = 100 // ms
		const EXECUTION_TIME_LIMIT = 1 // ms

		return (
			<div className="mt-4 p-4 bg-gray-50 rounded-lg border">
				<h3 className="text-lg text-gray-700 font-semibold mb-3 text-center">{'Evaluation Results'}</h3>

				{(strategy.evaluation.disqualified != null) && (
					<div className="text-red-600 mb-2">
						{'Disqualified: '}{strategy.evaluation.disqualified}
					</div>
				)}

				{/* Only show timing results if we have the data */}
				{strategy.evaluation.strategyExecutionTimings != null &&
					strategy.evaluation.strategyLoadingTimings != null &&
					strategy.evaluation.averageExecutionTime != null && (
					<>
						<div className="space-y-4">
							{/* Results display */}
							{(strategy.evaluation.results != null) && (
								<div className="space-y-2">
									<div className="flex gap-x-8">
										<span className="text-gray-600">{'Your Score: \r'}
											<span className="ml-2 font-medium">{strategy.evaluation.results.candidate.toFixed(2)}</span>
										</span>
										<span className="text-gray-600">{'Other Strategies Average: \r'}
											<span className="ml-2 font-medium">{strategy.evaluation.results.average.toFixed(2)}</span>
										</span>
									</div>
								</div>
							)}

							{/* Time limit feedback */}
							<div className="grid gap-3">
								<div className="flex flex-col">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">{'Loading Time Limit ('}{LOADING_TIME_LIMIT}{'ms)'}</span>
										<span className={`text-sm font-medium ${strategy.evaluation.loadingTimeExceeded ? 'text-red-600' : 'text-green-600'}`}>
											{strategy.evaluation.strategyLoadingTimings.toFixed(2)}{'ms\r'}
										</span>
									</div>
									<div className="h-2 bg-gray-200 rounded-full mt-1">
										<div
											style={{ width: `${Math.min((strategy.evaluation.strategyLoadingTimings / LOADING_TIME_LIMIT) * 100, 100)}%` }}
											className={`h-full rounded-full transition-all ${strategy.evaluation.loadingTimeExceeded ? 'bg-red-500' : 'bg-green-500'}`}
										/>
									</div>
								</div>

								<div className="flex flex-col">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">{'Execution Time Limit ('}{EXECUTION_TIME_LIMIT}{'ms)'}</span>
										<span className={`text-sm font-medium ${strategy.evaluation.executionTimeExceeded ? 'text-red-600' : 'text-green-600'}`}>
											{strategy.evaluation.averageExecutionTime.toFixed(3)}{'ms avg\r'}
										</span>
									</div>
									<div className="h-2 bg-gray-200 rounded-full mt-1">
										<div
											style={{ width: `${Math.min((strategy.evaluation.averageExecutionTime / EXECUTION_TIME_LIMIT) * 100, 100)}%` }}
											className={`h-full rounded-full transition-all ${strategy.evaluation.executionTimeExceeded ? 'bg-red-500' : 'bg-green-500'}`}
										/>
									</div>
								</div>
							</div>

							{/* Histogram */}
							<div className="mt-2 text-sm text-gray-600">
								{strategy.evaluation.strategyExecutionTimings.length > 0 && (
									<ExecutionTimeHistogram times={strategy.evaluation.strategyExecutionTimings} />
								)}
							</div>
						</div>
					</>
				)}
			</div>
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto p-6 max-w-7xl">
				<div className="backdrop-blur-sm bg-white/80 shadow-lg rounded-2xl p-8">
					<div className="flex items-center justify-between mb-8">
						<Link
							href={`/user/${params.userId}/strategies`}
							className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105"
						>
							<span className="inline-flex items-center">
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
								</svg>
								{'Back\r'}
							</span>
						</Link>
						<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
							{'Strategy Details\r'}
						</h1>
						<button
							type='button'
							onClick={() => { void handleDelete() }}
							className="text-red-500 hover:text-red-600 transition-all hover:scale-105 flex items-center gap-2"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							{'Delete\r'}
						</button>
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
											<button
												type='button'
												onClick={() => {
													if (originalStrategy != null) {
														setStrategy(originalStrategy)
														setHasChanges(false)
													}
												}}
												className="bg-gray-100 text-gray-600 px-8 py-3 rounded-lg hover:bg-gray-200 hover:scale-105 transition-all"
											>
												{'Cancel\r'}
											</button>
										</>
									)}

									{strategy?.evaluation !== undefined && !hasChanges && (
										<span className={`px-4 py-2 rounded-lg text-sm font-medium ${
											(strategy.passedEvaluation ?? false)
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800'
										}`}>
											{(strategy.passedEvaluation ?? false) ? '✓ Passed Evaluation' : '✗ Failed Evaluation'}
										</span>
									)}
								</div>
								{renderEvaluationResults()}
							</div>

							<div className="min-h-[600px] border border-gray-100 rounded-xl overflow-hidden shadow-sm relative">
								<MonacoEditor
									value={strategy?.code ?? ''}
									height="600px"
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
			</div>
		</main>
	)
}
