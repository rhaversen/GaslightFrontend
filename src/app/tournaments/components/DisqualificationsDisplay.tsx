import React from 'react'

export const DisqualificationsDisplay = ({ disqualified }: {disqualified?: Record<string, string>[]}) => {
	return (
		<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-4 rounded-xl
        border border-indigo-500/30 shadow-lg">
			<div className="text-sm text-gray-200 mb-3">
				<span className="font-medium">{'Disqualifications ('}{disqualified?.length ?? 0}{')'}</span>
			</div>
			<div className="space-y-1.5 max-h-32 overflow-y-auto">
				{disqualified != null && disqualified.length > 0 ? (
					<div className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1.5">
						{disqualified.map((dq, index) => (
							<React.Fragment key={dq.submission + '-' + index}>
								<div>
									<span className="text-xs text-red-400" title={dq.submission}>
										{'#'}{dq.submission.slice(-6)}
									</span>
								</div>
								<div>
									<span className="text-xs text-gray-300 truncate" title={dq.reason}>
										{dq.reason}
									</span>
								</div>
							</React.Fragment>
						))}
					</div>
				) : (
					<div className="text-sm text-gray-400">{'No disqualifications'}</div>
				)}
			</div>
		</div>
	)
}
