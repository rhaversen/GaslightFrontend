export const PercentileBar = ({ value, max, label }: { value: number, max: number, label: string }) => {
	const percentage = (value / max) * 100
	return (
		<div className="flex items-center gap-1">
			<span className="text-xs w-7">{label}{':'}</span>
			<div className="h-4 flex-grow bg-gray-800 rounded">
				<div 
					className="h-full bg-blue-500 rounded" 
					style={{ width: `${percentage}%` }}
					title={`${value.toFixed(3)}`}
				/>
			</div>
		</div>
	)
}
