import { type ISubmission } from '@/types/backendDataTypes'
import Link from 'next/link'
import { type ReactElement } from 'react'

interface Props {
	strategy: ISubmission
	isOwnProfile: boolean
	userId: string
	onToggleActive: (strategyId: string, active: boolean) => Promise<void>
	onDelete: (strategy: ISubmission) => Promise<void>
	activeStrategyId: string | null
	isEvaluationRecent: (evaluation: ISubmission['evaluation']) => boolean
}

export function StrategyCard ({
	strategy,
	isOwnProfile,
	userId,
	onToggleActive,
	onDelete,
	activeStrategyId,
	isEvaluationRecent
}: Props): ReactElement {
	const StrategyContent = (): ReactElement => (
		<>
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
						<p>{'Number of tokens: '}{strategy.tokenCount}</p>
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
		</>
	)

	return (
		<div className="flex">
			{isOwnProfile
				? (
					<Link
						href={`/user/${userId}/strategies/${strategy._id}`}
						className="flex-1 border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
					>
						<StrategyContent />
					</Link>
				)
				: (
					<div className="flex-1 border border-gray-100 rounded-xl p-6">
						<StrategyContent />
					</div>
				)}
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
							onChange={(e) => { void onToggleActive(strategy._id, e.target.checked) }}
							disabled={(activeStrategyId !== null && activeStrategyId !== strategy._id) || !(strategy.passedEvaluation ?? false)}
							className="form-checkbox h-5 w-5 text-blue-600 disabled:text-gray-400"
						/>
						<span className="text-sm text-gray-600">{'Active'}</span>
					</label>
				)}
				{isOwnProfile && (
					<button
						onClick={() => { void onDelete(strategy) }}
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
	)
}
