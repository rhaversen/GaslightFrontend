export const DisqualificationsDisplay = ({ disqualified }: {disqualified?: Record<string, string>[]}) => {
	return (
		<div className="bg-gray-700 p-3 rounded-lg text-sm">
			<div className="text-xs text-gray-400 mb-2">{'Disqualifications ('}{disqualified?.length || 0}{')'}</div>
			<div className="space-y-1 max-h-32 overflow-y-auto">
				{disqualified ? (
					disqualified.map((dq, index) => (
						<div key={index} className="text-red-400 text-xs">
							<span className="block truncate" title={dq.submission}>
								{'#'}{dq.submission.slice(-6)}
							</span>
							<span className="block truncate text-gray-400" title={dq.reason}>
								{dq.reason}
							</span>
						</div>
					))
				) : (
					<div className="text-gray-400">{'No disqualifications'}</div>
				)}
			</div>
		</div>
	)
}
