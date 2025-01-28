import { TournamentStatistics } from '@/types/backendDataTypes'
import { PercentileBar } from './PercentileBar'

export const StatsDisplay = ({ statistics }: { statistics: TournamentStatistics }) => {
	return (
		<div className="bg-gray-700 p-3 rounded-lg text-sm">
			<div className="text-xs text-gray-400 mb-2">{'Percentiles'}</div>
			<div className="space-y-1 mb-2">
				<PercentileBar 
					value={statistics.percentiles.p25}
					max={statistics.percentiles.p90}
					label="25th"
				/>
				<PercentileBar 
					value={statistics.percentiles.p50}
					max={statistics.percentiles.p90}
					label="50th"
				/>
				<PercentileBar 
					value={statistics.percentiles.p75}
					max={statistics.percentiles.p90}
					label="75th"
				/>
				<PercentileBar 
					value={statistics.percentiles.p90}
					max={statistics.percentiles.p90}
					label="90th"
				/>
			</div>
			<div className="grid grid-cols-3 gap-x-2 text-gray-300 text-xs">
				<span title={`Mean: ${statistics.averageScore.toFixed(2)}`}>
					{'μ: '}{statistics.averageScore.toFixed(1)}
				</span>
				<span title={`Median: ${statistics.medianScore.toFixed(2)}`}>
					{'m: '}{statistics.medianScore.toFixed(1)}
				</span>
			</div>
		</div>
	)
}
