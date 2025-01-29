import { TournamentStatistics } from '@/types/backendDataTypes'

export const StatsDisplay = ({ 
	statistics, 
	showBounds = false 
}: { 
	statistics: TournamentStatistics,
	showBounds?: boolean
}) => {
	const stats = {
		p10: statistics.percentiles.p10,
		q1: statistics.percentiles.p25,
		median: statistics.percentiles.p50,
		mean: statistics.centralTendency.arithmeticMean,
		q3: statistics.percentiles.p75,
		p90: statistics.percentiles.p90,
		lowerBound: statistics.tukeyCriteria.lowerBound,
		upperBound: statistics.tukeyCriteria.upperBound,
	}
    
	const range = showBounds 
		? stats.upperBound - stats.lowerBound
		: stats.q3 - stats.q1

	const getPosition = (value: number) => ((value - (showBounds ? stats.lowerBound : stats.q1)) / range) * 100

	const keyPoints = [
		{ value: stats.p10, label: '10th', color: 'text-gray-400', position: 'top' },
		{ value: stats.q1, label: 'Q1', color: 'text-blue-300', position: 'bottom-1' },
		{ value: stats.median, label: 'Q2', color: 'text-white', position: 'bottom-1' },
		{ value: stats.mean, label: 'μ', color: 'text-yellow-400', position: 'bottom-1' },
		{ value: stats.q3, label: 'Q3', color: 'text-blue-300', position: 'bottom-1' },
		{ value: stats.p90, label: '90th', color: 'text-gray-400', position: 'top' }
	] as const

	return (
		<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-4 rounded-xl
        border border-indigo-500/20 shadow-lg">
			{/* Header */}
			<div className="text-sm text-gray-200 mb-3 flex justify-between items-center">
				<span className="font-medium">{'Score Distribution'}</span>
				<div className="flex gap-4 text-xs">
					{[['bg-yellow-400', 'Mean'], ['bg-white', 'Median']].map(([bg, label]) => (
						<div key={label} className="flex items-center gap-1.5">
							<div className={`w-1.5 h-1.5 ${bg} rounded-full`}/>
							<span className="text-gray-300">{label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Chart */}
			<div className="relative h-24 sm:h-20 my-4 mx-2">
				{/* Grid lines */}
				{keyPoints
					.filter(point => showBounds || (
						point.value >= stats.q1 && 
                        point.value <= stats.q3
					))
					.map(({ value, label }) => (
						<div
							key={label}
							className="absolute h-full w-px bg-gray-600/20"
							style={{ left: `calc(${getPosition(value)}% - 0.5px)` }}
						/>
					))}

				{/* Base line */}
				<div className="absolute w-full h-px bg-gray-600/50 top-1/2"/>

				{/* Box plot */}
				<div className="absolute top-1/2 -translate-y-1/2 w-full h-8">
					{/* Whiskers */}
					{showBounds && [[stats.lowerBound, stats.q1], [stats.q3, stats.upperBound]].map(([start, end], i) => (
						<div key={i} className="absolute h-px bg-gray-400/60"
							style={{
								left: `calc(${getPosition(start)}% - 0.5px)`,
								width: `${getPosition(end) - getPosition(start)}%`,
								top: '50%'
							}}
						/>
					))}

					{/* Box */}
					<div 
						className="absolute h-full bg-indigo-500/20 border border-indigo-500/40"
						style={{
							left: `${getPosition(stats.q1)}%`,
							width: `${getPosition(stats.q3) - getPosition(stats.q1)}%`
						}}
					/>

					{/* Markers */}
					{[
						[stats.median, 'white'],
						[stats.mean, 'yellow-400']
					].map(([value, color]) => (
						<div 
							key={color}
							className={`absolute top-1/2 -translate-y-1/2 transition-transform duration-300
                            hover:scale-150`}
							style={{ left: `calc(${getPosition(value as number)}% - 4px)` }}
						>
							<div className={`w-2 h-2 rounded-full bg-${color} shadow-lg`}/>
						</div>
					))}

					{/* Outliers */}
					{statistics.outlierValues.map((value, i) => (
						<div
							key={i}
							className="absolute w-1.5 h-1.5 bg-red-400 rounded-full top-1/2 -translate-y-1/2
                            transition-all duration-300 hover:scale-150 hover:bg-red-300"
							style={{ left: `${getPosition(value)}%` }}
							title={`Outlier: ${value.toFixed(3)}`}
						/>
					))}
				</div>

				{/* Labels */}
				{keyPoints
					.filter(point => showBounds || (point.label !== '10th' && point.label !== '90th'))
					.map(({ value, label, color, position }) => (
						<div
							key={label}
							className={`absolute text-center -translate-x-1/2 ${color}`}
							style={{ 
								left: `${getPosition(value)}%`,
								top: position === 'top' 
									? '0%'
									: position === 'bottom-1'
										? '75%'
										: '85%',
								opacity: 0.8
							}}
						>
							<div className="text-[0.65rem] font-medium">{label}</div>
							<div className="text-[0.6rem] opacity-75">{value.toFixed(2)}</div>
						</div>
					))}
			</div>
		</div>
	)
}
