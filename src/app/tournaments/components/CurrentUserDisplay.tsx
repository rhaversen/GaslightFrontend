import { TournamentStanding } from '@/types/backendDataTypes'
import Link from 'next/link'

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
				<div className="space-y-3">
					<div className="flex items-center justify-evenly">
						<div className="text-2xl font-bold text-white">
							{'#'}{standing.placement}
						</div>
						<div>
							<div className="text-2xl text-gray-200">{standing.percentileRank.toFixed(1)}{'%'}</div>
						</div>
					</div>
					<div className="border-t border-indigo-500/20 pt-2">
						<div className="mb-3">
							<span className="text-indigo-200 text-sm">{'Submission:'}</span>{' '}
							<Link href={`/strategies/${standing.submission}`}>
								<span className="text-gray-300 text-sm font-medium hover:text-sky-200 transition-colors">
									{standing.submissionName}
								</span>
							</Link>
						</div>
						<div className="space-y-1.5">
							<div className="flex items-center gap-3" title="Average scored per game">
								<span className="text-indigo-200 text-sm">{'Raw score::'}</span>
								<span className="text-gray-400 text-sm font-medium">{standing.score.toFixed(2)}</span>
							</div>
							<div className="flex items-center gap-3" title="Total number of syntax tokens in the strategy code. Each token represents a basic programming element like a keyword, operator, or identifier.">
								<span className="text-indigo-200 text-sm">{'Strategy Tokens:'}</span>
								<span className="text-gray-400 text-sm font-medium">{standing.tokenCount}</span>
							</div>
							<div className="flex items-center gap-3" title="Average time taken to execute the strategy">
								<span className="text-indigo-200 text-sm">{'Execution time:'}</span>
								<span className="text-gray-400 text-sm font-medium">{standing.avgExecutionTime.toFixed(2)}{'ms'}</span>
							</div>
						</div>
					</div>
				</div>
			) : (
				isLoggedIn ? (
					<div className="text-gray-400 text-sm">
						{'You have not submitted to this tournament.\r'}
					</div>
				) : (
					<div className="text-gray-400 text-sm">
						<Link href="/login" className="text-sky-400 hover:text-sky-300 transition-colors">
							{'Login'}
						</Link>
						{' to view your position.\r'}
					</div>
				)
			)}
		</div>
	)
}
