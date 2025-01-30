import { TournamentStanding } from '@/types/backendDataTypes'
import { formatScore, formatZScore } from '@/lib/scoreUtils'
import Link from 'next/link'

export const WinnerDisplay = ({
	winner,
	isCurrentUser
}: {
	winner: TournamentStanding;
	isCurrentUser: boolean;
}) => {
	return (
		<div 
			className={`
				bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-3 rounded-xl
				border border-yellow-500/20 shadow-lg transition-all duration-300
				hover:shadow-yellow-500/10 hover:border-yellow-500/40
				relative
				${isCurrentUser ? 'place-glow first-place-glow' : ''}
			`}
		>
			<h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-yellow-400 flex items-center gap-2">
				{'Winner'}
				{isCurrentUser && (
					<span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 rounded-full">{'You !'}</span>
				)}
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-[60%_40%] gap-2">
				<div className="space-y-1.5">
					<div>
						<Link href={`/users/${winner.user}`}>
							<span
								className="
									text-gray-100
									hover:text-yellow-200 transition-colors
								"
								title={winner.userName}
							>
								{winner.userName}
							</span>
						</Link>
						<span className="text-gray-500">{' with '}</span>
						<Link href={`/submissions/${winner.submission}`}>
							<span
								className="
									text-sm text-gray-300
									hover:text-yellow-200 transition-colors
								"
								title={winner.submissionName}
							>
								{winner.submissionName}
							</span>
						</Link>
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<div className="text-gray-200" title={`First Place Score: ${winner.grade}`}>
						{formatScore(winner.grade)}
					</div>
					<div className="text-gray-400 text-sm" title={`Z-Score: ${winner.zValue}`}>
						{formatZScore(winner.zValue)}
					</div>
				</div>
			</div>
		</div>
	)
}
