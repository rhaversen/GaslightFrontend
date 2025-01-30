import { TournamentType } from '@/types/backendDataTypes'
import { formatDate } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/timeUtils'
import { WinnerDisplay } from './WinnerDisplay'
import { StatsDisplay } from './StatsDisplay'
import { RunnerUpDisplay } from './RunnersUp'

interface TournamentCardProps {
	tournament: TournamentType
	currentUserId?: string
}

export function TournamentCard({ tournament, currentUserId }: TournamentCardProps) {
	const currentUserStanding = tournament.standings.find(s => s.user === currentUserId)

	return (
		<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-4 border border-gray-700/30 backdrop-blur-sm">
			<div className="text-gray-400 mb-3 text-sm font-medium flex justify-between items-start">
				<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
					<div className="flex items-center gap-2">
						<span title={`Created: ${formatDate(tournament.createdAt)}`}>
							{formatDate(tournament.createdAt)}
						</span>
						<span className="text-gray-500/80" title="Tournament execution time">
							{'('}{formatDuration(tournament.tournamentExecutionTime)}{')'}
						</span>
					</div>
					<span className="text-gray-500/80" title="Number of submissions">
						{tournament.gradings.length}{' submissions'}
					</span>
				</div>
				<button
					onClick={() => console.log('Navigate to tournament:', tournament._id)}
					className="px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-all duration-300 hover:border-indigo-500/50"
				>
					{'View Details →'}
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,400px)_minmax(300px,400px)_1fr] gap-2">
				<WinnerDisplay 
					winner={tournament.standings[0]} 
					isCurrentUser={tournament.standings[0].user === currentUserId} 
				/>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
					<RunnerUpDisplay 
						place={2} 
						winner={tournament.standings[1]} 
						isCurrentUser={tournament.standings[1].user === currentUserId} 
					/>
					<RunnerUpDisplay 
						place={3} 
						winner={tournament.standings[2]} 
						isCurrentUser={tournament.standings[2].user === currentUserId} 
					/>
				</div>
				<StatsDisplay 
					tournamentId={tournament._id}
					userGrade={currentUserStanding?.grade}
				/>
			</div>
		</div>
	)
}
