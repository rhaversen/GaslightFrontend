import { type ISubmission } from '@/types/backendDataTypes'
import Link from 'next/link'
import { type ReactElement, useState } from 'react'

interface Props {
	strategy: ISubmission
	isOwnProfile: boolean
	userId: string
	onToggleActive: (strategyId: string, active: boolean) => Promise<void>
	onDelete: (strategy: ISubmission) => Promise<void>
	activeStrategyId: string | null
	isEvaluationRecent: (evaluation: ISubmission['evaluation']) => boolean
	onEvaluate: (strategyId: string) => Promise<void>
}

export function StrategyCard ({
	strategy,
	isOwnProfile,
	userId,
	onToggleActive,
	onDelete,
	activeStrategyId,
	isEvaluationRecent,
	onEvaluate
}: Props): ReactElement {
	const [isEvaluating, setIsEvaluating] = useState(false)

	const handleEvaluate = async (strategyId: string): Promise<void> => {
		setIsEvaluating(true)
		try {
			await onEvaluate(strategyId)
		} finally {
			setIsEvaluating(false)
		}
	}

	const StrategyContent = (): ReactElement => (
		<>
			<div className="flex justify-between items-start">
				<h3 className="text-xl font-semibold text-gray-800">{strategy.title}</h3>
				{isOwnProfile && (
					<button
						type='button'
						onClick={(e) => {
							e.preventDefault()
							void handleEvaluate(strategy._id)
						}}
						className={`flex items-center text-sm gap-2 px-2 py-1 rounded-lg transition-all ${
							isEvaluating
								? 'bg-gray-100 text-gray-600'
								: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
						}`}
						disabled={isEvaluating}
						title={isEvaluating ? 'Evaluation in progress...' : 'Run strategy evaluation'}
					>
						{isEvaluating
							? (
								<>
									<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									<span>{'Evaluating...'}</span>
								</>
							)
							: (
								<>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span>{'Run Evaluation'}</span>
								</>
							)}
					</button>
				)}
			</div>
			<div className="mt-4 space-y-4">
				<div className="flex flex-wrap gap-4 items-center">
					<span className={`px-3 py-1 rounded-full text-sm ${
						strategy.passedEvaluation === null
							? 'bg-yellow-100 text-yellow-800'
							: strategy.passedEvaluation
								? 'bg-green-100 text-green-800'
								: 'bg-red-100 text-red-800'
					}`}>
						{strategy.passedEvaluation === null
							? 'Not Evaluated'
							: strategy.passedEvaluation
								? 'Passing'
								: 'Not Passing'}
					</span>
					{strategy.evaluation?.results != null && (
						<span className="text-sm text-gray-600">
							{'Score: '}<span className="font-semibold">{strategy.evaluation.results.candidate.toFixed(2)}</span>
							<span className="mx-2">{'•'}</span>
							{'Avg: '}<span className="font-semibold">{strategy.evaluation.results.average.toFixed(2)}</span>
						</span>
					)}
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="text-gray-600">
						<p>{'Number of tokens: '}{strategy.tokenCount}</p>
						<p>{'Last updated: '}{new Date(strategy.updatedAt).toLocaleDateString()}</p>
						<p>{'Created: '}{new Date(strategy.createdAt).toLocaleDateString()}</p>
					</div>
					{strategy.evaluation != null && isEvaluationRecent(strategy.evaluation) && (
						<div className="pl-4 border-l border-gray-200">
							<h4 className="font-medium text-gray-700 mb-2">{'Latest Evaluation Details'}</h4>
							{strategy.evaluation.disqualified != null
								? (
									<div className="text-red-600 text-sm">
										{'Disqualified: '}{strategy.evaluation.disqualified}
									</div>
								)
								: (
									<div className="space-y-2 text-sm">
										<span className={strategy.evaluation.executionTimeExceeded ? 'text-red-600' : 'text-green-600'}>
											{'Execution: '}{strategy.evaluation?.averageExecutionTime != null ? `${strategy.evaluation.averageExecutionTime.toFixed(3)} milliseconds` : 'N/A'}
										</span>
									</div>
								)}
						</div>
					)}
				</div>
			</div>
		</>
	)

	return (
		<div className="flex">
			{isOwnProfile
				? (
					<Link
						href={`/user/${userId}/strategies/${strategy._id}`}
						className="flex-1 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
					>
						<StrategyContent />
					</Link>
				)
				: (
					<div className="flex-1 border border-gray-200 rounded-xl p-6">
						<StrategyContent />
					</div>
				)}
			{isOwnProfile && (
				<div className="flex flex-col justify-start items-center mt-6 ml-4 space-y-4">
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
							onChange={(e) => { void onToggleActive(strategy._id, e.target.checked) }}
							disabled={(activeStrategyId !== null && activeStrategyId !== strategy._id) || !(strategy.passedEvaluation ?? false)}
							className="form-checkbox h-5 w-5 text-blue-600 disabled:text-gray-400"
						/>
						<span className="text-sm text-gray-600">{'Active'}</span>
					</label>
					<button
						onClick={() => { void onDelete(strategy) }}
						className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
						title="Delete strategy"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			)}
		</div>
	)
}
