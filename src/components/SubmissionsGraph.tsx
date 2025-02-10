import React from 'react'
import { TournamentType } from '@/types/backendDataTypes'
import { formatDate } from '@/lib/dateUtils';

type Props = {
	tournaments: TournamentType[];
	showUserStanding?: boolean;
}

type TooltipData = {
	x: number;
	y: number;
	content: string;
}

const SubmissionsGraph: React.FC<Props> = ({ tournaments, showUserStanding }) => {
	const FIXED_HEIGHT = 300
	const padding = 40
	const [width, setWidth] = React.useState(0)
	const containerRef = React.useRef<HTMLDivElement>(null)

	// Update resize observer to only track width
	React.useEffect(() => {
		if (!containerRef.current) return

		const resizeObserver = new ResizeObserver(entries => {
			const containerWidth = entries[0].contentRect.width
			setWidth(containerWidth)
		})

		resizeObserver.observe(containerRef.current)
		return () => resizeObserver.disconnect()
	}, [])

	const graphWidth = width - padding * 2
	const graphHeight = FIXED_HEIGHT - padding * 2

	const [tooltip, setTooltip] = React.useState<TooltipData | null>(null)
	// Add state and ref for dynamic tooltip width
	const [tooltipWidth, setTooltipWidth] = React.useState(0)
	const tooltipTextRef = React.useRef<SVGTextElement | null>(null)

	React.useLayoutEffect(() => {
		if (tooltip && tooltipTextRef.current) {
			const bbox = tooltipTextRef.current.getBBox()
			setTooltipWidth(bbox.width)
		}
	}, [tooltip])

	// Add view mode state
	const [isPercentileView, setIsPercentileView] = React.useState(false)

	// Prepare data points with computed x and y for submissions and standing.
	const sortedData = tournaments.sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	)

	const maxSubmissions = Math.max(...sortedData.map(t => t.submissionCount)) || 1

	const dataPoints = sortedData.map((tournament, index) => {
		const x = (index / (sortedData.length - 1)) * graphWidth + padding
		const submissionY = isPercentileView
			? padding // In percentile view, submissions are always at 100%
			 : FIXED_HEIGHT - (tournament.submissionCount / maxSubmissions) * graphHeight - padding
		const percentile = tournament.userStanding?.percentileRank ?? 0
		const adjustedStanding = (percentile / 100) * tournament.submissionCount
		const standingY = isPercentileView
			 ? FIXED_HEIGHT - (percentile / 100) * graphHeight - padding
			: FIXED_HEIGHT - (adjustedStanding / maxSubmissions) * graphHeight - padding
		const date = formatDate(tournament.createdAt)
		return { x, submissionY, standingY, submissionCount: tournament.submissionCount, percentile, date }
	})

	// Compute polyline points from dataPoints.
	const submissionPolyPoints = dataPoints.map(d => `${d.x},${d.submissionY}`).join(' ')
	const standingPolyPoints = showUserStanding === true
		? dataPoints.map(d => `${d.x},${d.standingY}`).join(' ')
		: ''

	// Handlers for tooltip events.
	const handleMouseEnter = (x: number, y: number, content: string) => {
		setTooltip({ x, y, content })
	}
	const handleMouseLeave = () => setTooltip(null)

	// Generate date and axis labels (unchanged).
	const dateLabels = sortedData.map((tournament, index) => {
		const x = (index / (sortedData.length - 1)) * graphWidth + padding
		const date = formatDate(tournament.createdAt)
		const textAnchor = index === sortedData.length - 1 ? 'end' : index === 0 ? 'start' : 'middle'
		return (
			<text
				key={`${date}-${index}`}
				x={x}
				y={FIXED_HEIGHT - 10}
				textAnchor={textAnchor}
				className="text-xs fill-gray-600"
			>
				{date}
			</text>
		)
	})

	const submissionLabels = Array.from({ length: 5 }, (_, i) => {
		const value = isPercentileView
			? Math.round(100 * ((4 - i) / 4))
			: Math.round(maxSubmissions * ((4 - i) / 4))
		const y = padding + (i * graphHeight) / 4
		return (
			<text
				key={`sub-${value}`}
				x={padding - 5}
				y={y}
				textAnchor="end"
				alignmentBaseline="middle"
				className="text-xs fill-gray-600"
			>
				{value}{isPercentileView ? '%' : ''}
			</text>
		)
	})

	// Add computed tooltip x position to avoid label overflow
	const tooltipPosX = tooltip ? (tooltip.x + 10 + tooltipWidth > width ? tooltip.x - tooltipWidth - 10 : tooltip.x + 10) : 0;

	return (
		<div ref={containerRef} className="w-full">
			{showUserStanding && (
				<div className="mb-2 flex justify-end">
					<button
						onClick={() => setIsPercentileView(!isPercentileView)}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						{isPercentileView ? 'Show Submission Counts' : 'Show Percentile View'}
					</button>
				</div>
			)}
			<div className="relative" style={{ height: FIXED_HEIGHT }}>
				<svg
					className="absolute inset-0 w-full h-full"
					viewBox={`0 0 ${width || 800} ${FIXED_HEIGHT}`}
					preserveAspectRatio="xMidYMid meet"
				>
					{width > 0 && (
						<>
							{/* Grid lines */}
							{Array.from({ length: 5 }, (_, i) => (
								<line
									key={`grid-${i}`}
									x1={padding}
									y1={padding + (i * graphHeight) / 4}
									x2={width - padding}
									y2={padding + (i * graphHeight) / 4}
									className="stroke-gray-200"
									strokeDasharray="4 4"
								/>
							))}

							{/* Submissions area */}
							<path
								d={`M ${padding},${FIXED_HEIGHT - padding} ${submissionPolyPoints} ${width - padding},${FIXED_HEIGHT - padding} Z`}
								className="fill-blue-500/20"
							/>

							{/* Submissions polyline */}
							<polyline
								points={submissionPolyPoints}
								fill="none"
								className="stroke-blue-500 stroke-2"
							/>

							{/* Standing polyline */}
							{showUserStanding === true && (
								<polyline
									points={standingPolyPoints}
									fill="none"
									className="stroke-emerald-500 stroke-2"
								/>
							)}

							{/* Dots for submissions */}
							{dataPoints.map((d, i) => (
								<circle
									key={`sub-dot-${i}`}
									cx={d.x}
									cy={d.submissionY}
									r={4}
									className="fill-blue-500 cursor-pointer"
									onMouseEnter={() =>
										handleMouseEnter(
											d.x,
											d.submissionY - 10,
											`Submissions: ${d.submissionCount}`
										)
									}
									onMouseLeave={handleMouseLeave}
								/>
							))}
							{/* Dots for standing */}
							{showUserStanding === true &&
								dataPoints.map((d, i) => (
									<circle
										key={`stand-dot-${i}`}
										cx={d.x}
										cy={d.standingY}
										r={4}
										className="fill-emerald-500 cursor-pointer"
										onMouseEnter={() =>
											handleMouseEnter(
												d.x,
												d.standingY - 10,
												`Standing: ${d.percentile.toFixed(1)}%`
											)
										}
										onMouseLeave={handleMouseLeave}
									/>
								))}

							{/* Axes */}
							<line
								x1={padding}
								y1={padding}
								x2={padding}
								y2={FIXED_HEIGHT - padding}
								className="stroke-gray-300"
							/>
							<line
								x1={padding}
								y1={FIXED_HEIGHT - padding}
								x2={width - padding}
								y2={FIXED_HEIGHT - padding}
								className="stroke-gray-300"
							/>

							{/* Labels */}
							{dateLabels}
							{submissionLabels}

							{/* Legend */}
							<g transform={`translate(${padding + 10}, 20)`}>
								<line x1="0" y1="0" x2="20" y2="0" className="stroke-blue-500 stroke-2" />
								<text x="25" y="0" alignmentBaseline="middle" className="text-xs fill-gray-600">
									{'Submissions\r'}
								</text>
								{showUserStanding === true && (
									<g transform="translate(100, 0)">
										<line x1="0" y1="0" x2="20" y2="0" className="stroke-emerald-500 stroke-2" />
										<text x="25" y="0" alignmentBaseline="middle" className="text-xs fill-gray-600">
											{'Your Standing\r'}
										</text>
									</g>
								)}
							</g>

							{/* Tooltip */}
							{tooltip && (
								<g>
									<rect
										x={tooltipPosX}
										y={tooltip.y - 25}
										width={tooltipWidth + 10}
										height={24}
										fill="black"
										opacity="0.7"
										rx="4"
									/>
									<text
										ref={tooltipTextRef}
										x={tooltipPosX + 5}
										y={tooltip.y - 9}
										className="text-xs fill-white"
									>
										{tooltip.content}
									</text>
								</g>
							)}
						</>
					)}
				</svg>
			</div>
		</div>
	)
}

export default SubmissionsGraph
