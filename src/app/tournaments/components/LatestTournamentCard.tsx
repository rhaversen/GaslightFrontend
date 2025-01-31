import { TournamentType } from '@/types/backendDataTypes'
import { formatDate } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/timeUtils'
import { PlacementDisplay } from './PlacementDisplay'
import { StatsDisplay } from './StatsDisplay'
import { DisqualificationsDisplay } from './DisqualificationsDisplay'
import { CurrentUserDisplay } from './CurrentUserDisplay'

interface LatestTournamentCardProps {
	tournament: TournamentType
	currentUserId?: string
}

export function LatestTournamentCard({ tournament, currentUserId }: LatestTournamentCardProps) {
	return (
		<div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-2xl p-4 border-2 border-indigo-500/30 backdrop-blur-sm">
			<div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl" />
			<div className="absolute top-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 rounded-br-lg text-white text-sm font-medium">
				{'Latest Tournament\r'}
			</div>

			<div className="text-gray-400Zz mt-4 text-sm font-medium flex justify-between items-start">
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

			<div className="grid grid-cols-1 gap-2">
				<div className="grid grid-cols-1 lg:grid-cols-[60%_39%] gap-2">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
						<PlacementDisplay
							place={1}
							standing={tournament.standings[0]}
							isCurrentUser={tournament.standings[0].user === currentUserId}
						/>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
							{tournament.standings.slice(1, 3).map((standing) => (
								<PlacementDisplay
									key={standing.user}
									place={standing.placement}
									standing={standing}
									isCurrentUser={(standing.user === currentUserId) && (currentUserId !== undefined)}
								/>
							))}
						</div>
					</div>
					<CurrentUserDisplay
						standing={tournament.userStanding}
						isLoggedIn={currentUserId !== undefined}
					/>
				</div>
				
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[350px_1fr] gap-2">
					<DisqualificationsDisplay
						disqualified={tournament.disqualified}
					/>
					<StatsDisplay
						tournamentId={tournament._id}
						userGrade={tournament.userStanding?.grade}
					/>
				</div>
				
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
					{tournament.standings.slice(3, 15).map((standing) => (
						<PlacementDisplay 
							key={standing.user} 
							place={standing.placement} 
							standing={standing} 
							isCurrentUser={standing.user === currentUserId}
						/>
					))}
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
					{tournament.standings.slice(15, 30).map((standing) => (
						<PlacementDisplay 
							key={standing.user} 
							place={standing.placement} 
							standing={standing} 
							isCurrentUser={standing.user === currentUserId}
							simpleStartIndex={13}
						/>
					))}
				</div>
			</div>
		</div>
	)
}
