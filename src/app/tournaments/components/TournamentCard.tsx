import { TournamentType } from '@/types/backendDataTypes'
import { formatDate } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/timeUtils'
import { WinnerDisplay } from './WinnerDisplay'
import { StatsDisplay } from './StatsDisplay'
import { RunnerUpDisplay } from './RunnersUp'
import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@/lib/icons'
import { DisqualificationsDisplay } from './DisqualificationsDisplay'
import { motion, AnimatePresence } from 'framer-motion'

interface TournamentCardProps {
	tournament: TournamentType
	currentUserId?: string
}

export function TournamentCard({ tournament, currentUserId }: TournamentCardProps) {
	const [isExpanded, setIsExpanded] = useState(false)
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

			<div className="space-y-4">
				<div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,400px)_minmax(300px,400px)] gap-2">
					<WinnerDisplay
						winner={tournament.standings[0]}
						isCurrentUser={tournament.standings[0].user === currentUserId}
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
						{tournament.standings.slice(1, 3).map((standing) => (
							<RunnerUpDisplay
								key={standing.user}
								place={standing.placement}
								winner={standing}
								isCurrentUser={(standing.user === currentUserId) && (currentUserId !== undefined)}
							/>
						))}
					</div>
				</div>

				<div className="border-t border-gray-700/30 pt-2">
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300"
					>
						<span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
						<div className="w-4 h-4">
							{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
						</div>
					</button>

					<AnimatePresence>
						{isExpanded && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
								className='pt-3 overflow-hidden'
							>
								<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[350px_1fr] gap-2">
									<DisqualificationsDisplay
										disqualified={tournament.disqualified}
									/>
									<StatsDisplay
										tournamentId={tournament._id}
										userGrade={currentUserStanding?.grade}
									/>
								</div>
								<div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2">
									{tournament.standings.slice(3, 9).map((standing) => (
										<RunnerUpDisplay
											key={standing.user}
											place={standing.placement}
											winner={standing}
											isCurrentUser={(standing.user === currentUserId) && (currentUserId !== undefined)}
										/>
									))}

								</div>
								<div className="mt-2 gap-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
									{tournament.standings.slice(9, 30).map((standing) => (
										<RunnerUpDisplay
											key={standing.user}
											place={standing.placement}
											winner={standing}
											isCurrentUser={(standing.user === currentUserId) && (currentUserId !== undefined)}
											simpleStartIndex={10}
										/>
									))}

								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}
