import { TournamentStanding } from '@/types/backendDataTypes'

export function CurrentUserDisplay({
	standing,
	isLoggedIn
}: {
	standing: TournamentStanding | null
	isLoggedIn: boolean
}) {
	return (
		<div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
			<div className="text-indigo-300 text-sm font-medium mb-2">{'Your Standing'}</div>
			{standing ? (
				<div className="flex items-center justify-between">
					<div className="text-2xl font-bold text-white">
						{'#'}{standing.placement}
					</div>
					<div className="text-gray-400 text-sm">
						{'Score: '}{standing.grade.toFixed(2)}
					</div>
				</div>
			) : (
				isLoggedIn ? (
					<div className="text-gray-400 text-sm">
						{'You have not submitted to this tournament.\r'}
					</div>
				) : (
					<div className="text-gray-400 text-sm">
						{'Login to view your position.\r'}
					</div>
				)
			)}
		</div>
	)
}
