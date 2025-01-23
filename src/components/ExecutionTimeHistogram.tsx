import { type ReactElement, useMemo } from 'react'

const createTimeBuckets = (
	times: number[]
): Array<{ range: string, count: number, min: number, max: number }> => {
	if (times.length === 0) return []

	const bucketSize = 0.001 // Fixed 0.001ms buckets
	const min = 0 // Always start from 0
	const max = Math.ceil(Math.max(...times) * 1000) / 1000

	// Calculate number of buckets needed
	const bucketCount = Math.ceil((max - min) / bucketSize)

	// Limit to prevent performance issues
	const maxBuckets = 200 // Increased max buckets since we're using smaller size
	const actualBucketCount = Math.min(bucketCount, maxBuckets)

	const buckets = Array.from({ length: actualBucketCount }, (_, i) => ({
		min: i * bucketSize,
		max: (i + 1) * bucketSize,
		count: 0,
		range: `${(i * bucketSize).toFixed(3)}` // Show 3 decimal places
	}))

	times.forEach(time => {
		const bucketIndex = Math.min(
			Math.floor(time / bucketSize),
			actualBucketCount - 1
		)
		buckets[bucketIndex].count++
	})

	return buckets
}

const ExecutionTimeHistogram = ({
	times
}: {
	times: number[]
}): ReactElement => {
	const buckets = useMemo(() => createTimeBuckets(times), [times])
	const maxCount = Math.max(...buckets.map(b => b.count))
	const svgHeight = 100
	const barWidth = 5
	const spacing = 1

	return (
		<div className="mt-4">
			<h4 className="text-sm font-medium mb-2">{'Execution Time Distribution (ms)'}</h4>
			<div className="relative overflow-x-auto pb-4 w-full">
				<div className="mx-auto w-full min-w-full">
					<svg className="w-full h-[120px]" preserveAspectRatio="xMidYMid meet">
						{buckets.map((bucket, i) => (
							<g key={i} className="group">
								<rect
									x={i * (barWidth + spacing)}
									y={svgHeight - (bucket.count / maxCount * svgHeight)}
									width={barWidth}
									height={bucket.count / maxCount * svgHeight === 0 ? 1 : bucket.count / maxCount * svgHeight}
									className="fill-blue-400 hover:fill-blue-500 transition-colors"
								/>
								{i % 5 === 0 && (
									<text
										x={i * (barWidth + spacing) + barWidth / 2}
										y={svgHeight + 15}
										textAnchor="middle"
										className="text-[8px] fill-gray-500"
										transform={`rotate(45, ${i * (barWidth + spacing) + barWidth / 2}, ${svgHeight + 15})`}
									>
										{bucket.range}
									</text>
								)}
								<title>{`${bucket.range}ms: ${bucket.count} executions`}</title>
							</g>
						))}
					</svg>
				</div>
			</div>
		</div>
	)
}

export default ExecutionTimeHistogram
