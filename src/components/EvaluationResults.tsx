import { type ReactElement } from 'react'
import ExecutionTimeHistogram from './ExecutionTimeHistogram'
import { type ISubmission } from '@/types/backendDataTypes'

const EvaluationResults = ({
	strategy
}: {
	strategy: ISubmission
}): ReactElement | null => {
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

export default EvaluationResults
