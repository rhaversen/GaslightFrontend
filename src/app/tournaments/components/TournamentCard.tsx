import { TournamentStanding, TournamentType } from '@/types/backendDataTypes'
import { formatDate } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/timeUtils'
import { PlacementDisplay } from './PlacementDisplay'
import { StatsDisplay } from './StatsDisplay'
import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@/lib/icons'
import { DisqualificationsDisplay } from './DisqualificationsDisplay'
import { motion, AnimatePresence } from 'framer-motion'
import { CurrentUserDisplay } from './CurrentUserDisplay'
import axios from 'axios'

interface TournamentCardProps {
	tournament: TournamentType
	currentUserId?: string
}

export function TournamentCard({ tournament, currentUserId }: TournamentCardProps) {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [isExpanded, setIsExpanded] = useState(false)
	const [hasLoadedAdditional, setHasLoadedAdditional] = useState(false)
	const [allStandings, setAllStandings] = useState(tournament.standings)
	const [isLoadingStandings, setIsLoadingStandings] = useState(false)

	const fetchAdditionalStandings = async () => {
		if (hasLoadedAdditional) return
		setIsLoadingStandings(true)
		try {
			const response = await axios.get<TournamentStanding[]>(`${API_URL}/v1/tournaments/${tournament._id}/standings?amount=30`)
			setAllStandings([...tournament.standings, ...response.data.slice(3)])
			setHasLoadedAdditional(true)
		} catch (error) {
			console.error('Error fetching additional standings:', error)
		} finally {
			setIsLoadingStandings(false)
		}
	}

	const handleExpand = () => {
		if (!isExpanded) {
			void fetchAdditionalStandings()
		}
		setIsExpanded(!isExpanded)
	}

	return (
		<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-4 border border-gray-700/30 backdrop-blur-sm">
			<div className="text-gray-400 mt-4 text-sm font-medium flex justify-between items-start">
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

			<div className="grid grid-cols-1">
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

				<div>
					<AnimatePresence>
						{isExpanded && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.3, ease: 'easeInOut' }}
								className='pt-2 grid grid-cols-1 gap-2'
							>
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
									{isLoadingStandings ? (
										Array(12).fill(0).map((_, idx) => (
											<div key={idx} className="animate-pulse bg-gray-800 rounded-lg h-28" />
										))
									) : (
										allStandings.slice(3, 15).map((standing) => (
											<PlacementDisplay 
												key={standing.user} 
												place={standing.placement} 
												standing={standing} 
												isCurrentUser={standing.user === currentUserId}
											/>
										))
									)}
								</div>

								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
									{isLoadingStandings ? (
										Array(15).fill(0).map((_, idx) => (
											<div key={idx} className="animate-pulse bg-gray-800 rounded-lg h-10" />
										))
									) : (
										allStandings.slice(15, 30).map((standing) => (
											<PlacementDisplay 
												key={standing.user} 
												place={standing.placement} 
												standing={standing} 
												isCurrentUser={standing.user === currentUserId}
												simpleStartIndex={13}
											/>
										))
									)}
								</div>

							</motion.div>
						)}
					</AnimatePresence>
					<button
						onClick={handleExpand}
						className="w-full border-t border-gray-700/30 mt-3 pt-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300"
					>
						<span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
						<div className="w-4 h-4">
							{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
						</div>
					</button>
				</div>
			</div>
		</div>
	)
}
