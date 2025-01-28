import { formatDate } from '@/lib/dateUtils'
import { type ISubmission } from '@/types/backendDataTypes'
import Link from 'next/link'
import { type ReactElement, useState } from 'react'

interface Props {
	strategy: ISubmission
	isOwnProfile: boolean
	onToggleActive: (strategyId: string, active: boolean) => Promise<void>
	onDelete: (strategy: ISubmission) => Promise<void>
	activeStrategyId: string | null
	onEvaluate: (strategyId: string) => Promise<void>
}

export function StrategyCard ({
	strategy,
	isOwnProfile,
	onToggleActive,
	onDelete,
	activeStrategyId,
	onEvaluate
}: Props): ReactElement<any> {
	const [isEvaluating, setIsEvaluating] = useState(false)
	const evaluationTime = strategy.evaluation?.updatedAt ?? strategy.evaluation?.createdAt

	const handleEvaluate = async (strategyId: string): Promise<void> => {
		setIsEvaluating(true)
		try {
			await onEvaluate(strategyId)
		} finally {
			setIsEvaluating(false)
		}
	}

	const StrategyContent = (): ReactElement<any> => (
		<>
			<div className="flex justify-between items-center">
				<h3 className="text-xl font-semibold text-gray-800">{strategy.title}</h3>
				{isOwnProfile && (
					<button
						type='button'
						onClick={(e) => {
							e.preventDefault()
							void handleEvaluate(strategy._id)
						}}
						className={`flex items-center text-sm gap-2 px-2 py-1 m-1 rounded-lg transition-all ${
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
						<p>{'Last updated: '}{formatDate(strategy.updatedAt)}</p>
						<p>{'Created: '}{formatDate(strategy.createdAt)}</p>
					</div>
					{strategy.evaluation != null && (
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
					{strategy.evaluation != null && (
						<div className="text-sm text-gray-500">
							{evaluationTime != null && (
								<span>{'Evaluated: '}{formatDate(evaluationTime)}</span>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	)

	return (
		<div className="flex flex-col lg:flex-row border border-gray-200 rounded-xl bg-white">
			{isOwnProfile
				? (
					<Link
						href={`/strategy/${strategy._id}`}
						className="flex-1 p-6 hover:bg-gray-50 transition-all duration-300 rounded-xl"
					>
						<StrategyContent />
					</Link>
				)
				: (
					<div className="flex-1 p-6">
						<StrategyContent />
					</div>
				)}
			{isOwnProfile && (
				<div className="flex gap-4 px-4 py-3 lg:w-1/5 border-t lg:border-t-0 lg:border-l border-gray-200 rounded-b-xl lg:rounded-bl-none lg:rounded-r-xl">
					<div className="flex lg:flex-col gap-4 items-center w-full justify-between lg:items-end">
						<label
							className={`flex items-center p-2 rounded-lg ${
								(activeStrategyId !== null && activeStrategyId !== strategy._id) || !(strategy.passedEvaluation ?? false)
									? 'opacity-50 cursor-not-allowed'
									: 'hover:bg-gray-100 cursor-pointer'
							}`}
							title={
								!(strategy.passedEvaluation ?? false)
									? 'Strategy must pass evaluation before it can be activated'
									: (activeStrategyId !== null && activeStrategyId !== strategy._id)
										? 'Only one strategy can be active at a time'
										: ''
							}
						>
							<div className="relative">
								<input
									type="checkbox"
									checked={strategy.active}
									onChange={(e) => { void onToggleActive(strategy._id, e.target.checked) }}
									disabled={(activeStrategyId !== null && activeStrategyId !== strategy._id) || !(strategy.passedEvaluation ?? false)}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
							</div>
							<span className="ml-3 text-sm font-medium text-gray-700 select-none">{'Active'}</span>
						</label>
						<button
							onClick={() => { void onDelete(strategy) }}
							className="group p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
							title="Delete strategy"
						>
							<svg className="w-5 h-5 text-red-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							<span className="text-sm font-medium text-red-600 group-hover:text-red-700">{'Delete'}</span>
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
