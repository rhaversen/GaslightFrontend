import { type ReactElement, useMemo, useRef, useState, useEffect } from 'react'

const createTimeBuckets = (times: number[]): Array<{ range: string, count: number }> => {
	if (times.length === 0) return []

	const bucketSize = 0.001
	const maxTime = Math.ceil(Math.max(...times) * 1000) / 1000
	const bucketCount = Math.min(Math.ceil(maxTime / bucketSize), 200)

	const buckets = Array.from({ length: bucketCount }, (_, i) => ({
		range: (i * bucketSize).toFixed(3),
		count: 0
	}))

	times.forEach(time => {
		const index = Math.min(Math.floor(time / bucketSize), bucketCount - 1)
		buckets[index].count++
	})

	return buckets
}

const ExecutionTimeHistogram = ({ times }: { times: number[] }): ReactElement => {
	const buckets = useMemo(() => createTimeBuckets(times), [times])
	const maxCount = Math.max(...buckets.map(b => b.count))
	const containerRef = useRef<HTMLDivElement>(null)
	const labelInterval = 15
	const [containerWidth, setContainerWidth] = useState(0)

	useEffect(() => {
		if (containerRef.current === null) return
		const observer = new ResizeObserver(entries => { setContainerWidth(entries[0].contentRect.width) }
		)
		observer.observe(containerRef.current)
		return () => { observer.disconnect() }
	}, [])

	const width = Math.max(300, containerWidth)
	const barWidth = Math.min(10, Math.max(2, (width / buckets.length) * 0.8))
	const spacing = barWidth * 0.25
	const viewBoxWidth = (barWidth + spacing) * buckets.length + 15

	const shouldShowLabel = (range: string, index: number): boolean => {
		const value = Math.round(parseFloat(range) * 1000)
		if (value % labelInterval !== 0) return false // 0.02ms intervals

		// Check if this is the first bucket in this interval
		const prevValue = index > 0 ? Math.round(parseFloat(buckets[index - 1].range) * 1000) : -1
		return Math.floor(value / labelInterval) !== Math.floor(prevValue / labelInterval)
	}

	return (
		<div className="mt-4">
			<h4 className="text-sm font-medium mb-2">{'Execution Time Distribution (ms)'}</h4>
			<div ref={containerRef} className="relative w-full min-h-[120px] max-h-[200px]">
				<svg
					className="w-full h-full"
					preserveAspectRatio="xMidYMid meet"
					viewBox={`0 0 ${viewBoxWidth} 130`}
				>
					{buckets.map((bucket, i) => (
						<g key={i} className="group">
							{bucket.count > 0 && (
								<rect
									x={15 + i * (barWidth + spacing)}
									y={100 - (bucket.count / maxCount * 100)}
									width={barWidth}
									height={bucket.count / maxCount * 100}
									className="fill-blue-400 hover:fill-blue-500 transition-colors"
								/>
							)}
							{shouldShowLabel(bucket.range, i) && (
								<>
									<line
										x1={15 + i * (barWidth + spacing) + barWidth / 2}
										y1={101}
										x2={15 + i * (barWidth + spacing) + barWidth / 2}
										y2={106}
										stroke="rgb(107 114 128)"
										strokeWidth="1"
									/>
									<text
										x={15 + i * (barWidth + spacing) + barWidth / 2}
										y={115}
										textAnchor="middle"
										className="text-[10px] fill-gray-500"
										transform={`rotate(45, ${5 + i * (barWidth + spacing) + barWidth / 2}, 112)`}
									>
										{bucket.range}
									</text>
								</>
							)}
							{bucket.count > 0 && (
								<title>{`${bucket.range}ms: ${bucket.count} executions`}</title>
							)}
						</g>
					))}
				</svg>
			</div>
		</div>
	)
}

export default ExecutionTimeHistogram
