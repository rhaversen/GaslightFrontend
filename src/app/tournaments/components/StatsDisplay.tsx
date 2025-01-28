import { TournamentStatistics } from '@/types/backendDataTypes'
import { PercentileBar } from './PercentileBar'

export const StatsDisplay = ({ statistics }: { statistics: TournamentStatistics }) => {
	const percentiles = [
		statistics.percentiles.p25,
		statistics.percentiles.p50,
		statistics.percentiles.p75,
		statistics.percentiles.p90
	]
	const minValue = Math.min(...percentiles)
	const maxValue = Math.max(...percentiles)
	const range = maxValue - minValue

	return (
		<div className="bg-gray-700 p-3 rounded-lg text-sm">
			<div className="text-xs text-gray-400 mb-1">{'Statistics'}</div>
			<div className="grid grid-cols-3 gap-x-2 text-gray-300 text-xs mb-2">
				<span title={`Mean: ${statistics.averageScore.toFixed(2)}`}>
					{'μ: '}{statistics.averageScore.toFixed(1)}
				</span>
				<span title={`Median: ${statistics.medianScore.toFixed(2)}`}>
					{'m: '}{statistics.medianScore.toFixed(1)}
				</span>
			</div>
			<div className="text-xs text-gray-400 mb-1">{'Score Percentiles'}</div>
			<div className="space-y-1">
				<PercentileBar
					value={statistics.percentiles.p25}
					min={minValue}
					range={range}
					label="25th"
				/>
				<PercentileBar
					value={statistics.percentiles.p50}
					min={minValue}
					range={range}
					label="50th"
				/>
				<PercentileBar
					value={statistics.percentiles.p75}
					min={minValue}
					range={range}
					label="75th"
				/>
				<PercentileBar
					value={statistics.percentiles.p90}
					min={minValue}
					range={range}
					label="90th"
				/>
			</div>
		</div>
	)
}
