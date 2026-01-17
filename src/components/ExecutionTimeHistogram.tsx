import { type ReactElement, useMemo, useRef, useState, useEffect } from 'react'

const createTimeBuckets = (times: number[]): Array<{ range: string, count: number }> => {
	if (times.length === 0) { return [] }

	// Sort times
	const sortedTimes = times.sort((a, b) => a - b)

	const bucketSize = 0.02
	// Create 100 buckets for 0-1ms range, plus one overflow bucket
	const buckets = Array.from({ length: 101 }, (_, i) => ({
		range: i === 100 ? '≥1.00' : (i * bucketSize).toFixed(2),
		count: 0
	}))

	sortedTimes.forEach(time => {
		const index = time >= 1 ? 100 : Math.floor(time / bucketSize)
		buckets[index].count++
	})

	return buckets
}

const ExecutionTimeHistogram = ({ times }: { times: number[] }): ReactElement<any> => {
	const buckets = useMemo(() => createTimeBuckets(times), [times])
	const maxCount = Math.max(...buckets.map(b => b.count))
	const containerRef = useRef<HTMLDivElement>(null)
	const [containerWidth, setContainerWidth] = useState(0)

	useEffect(() => {
		if (containerRef.current === null) { return }
		const observer = new ResizeObserver(entries => { setContainerWidth(entries[0].contentRect.width) })
		observer.observe(containerRef.current)
		return () => { observer.disconnect() }
	}, [])

	const width = Math.max(300, containerWidth)
	const barWidth = Math.min(10, Math.max(2, (width / buckets.length) * 0.8))
	const spacing = barWidth * 0.25
	const viewBoxWidth = (barWidth + spacing) * buckets.length + 15

	// Calculate label interval based on container width
	const labelInterval = useMemo(() => {
		if (width < 400) { return 400 } // Show label every 0.4ms
		if (width < 600) { return 200 } // Show label every 0.2ms
		if (width < 800) { return 100 } // Show label every 0.1ms
		return 50 // Show label every 0.05ms
	}, [width])

	const shouldShowLabel = (range: string, index: number): boolean => {
		const value = Math.round(parseFloat(range) * 1000)
		if (value % labelInterval !== 0) { return false }

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
										y={120}
										textAnchor="middle"
										className="text-[12px] fill-gray-500"
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
