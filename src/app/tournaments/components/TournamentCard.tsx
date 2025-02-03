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
import Link from 'next/link'

const TOP_PLACES = 3 // Cannot be modified, as it's matched with the design
const FULL_DISPLAY_PLACES = 8
const MAX_SIMPLIFIED_DISPLAY_PLACES = 20
const SIMPLIFIED_DISPLAY_START = FULL_DISPLAY_PLACES + TOP_PLACES
const MAX_STANDINGS = 30
const OTHER_STANDINGS = MAX_STANDINGS - TOP_PLACES

interface TournamentCardProps {
	tournament: TournamentType
	currentUserId?: string
	isLatest?: boolean
	defaultExpanded?: boolean
}

export const TournamentCard = ({ tournament, currentUserId, isLatest = false, defaultExpanded = false }: TournamentCardProps) => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const [isExpanded, setIsExpanded] = useState(defaultExpanded)
	const [hasLoadedAdditional, setHasLoadedAdditional] = useState(defaultExpanded)
	const [allStandings, setAllStandings] = useState(tournament.standings)
	const [isLoadingStandings, setIsLoadingStandings] = useState(false)

	const chunk1Count = Math.min(Math.max(0, tournament.submissionCount - TOP_PLACES), FULL_DISPLAY_PLACES)
	const chunk2Count = Math.min(Math.max(0, tournament.submissionCount - SIMPLIFIED_DISPLAY_START), MAX_SIMPLIFIED_DISPLAY_PLACES)

	const fetchAdditionalStandings = async () => {
		if (hasLoadedAdditional) return
		setIsLoadingStandings(true)
		try {
			const response = await axios.get<TournamentStanding[]>(`${API_URL}/v1/tournaments/${tournament._id}/standings`, {
				params: {
					limitStandings: OTHER_STANDINGS,
					skipStandings: TOP_PLACES,
					sortFieldStandings: 'placement',
					sortDirectionStandings: 'asc',
				}
			})
			setAllStandings([...tournament.standings, ...response.data])
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
		<div
			className={`relative overflow-hidden bg-gradient-to-br from-gray-800${isLatest ? '/90' : ''} to-gray-900${isLatest ? '/90' : ''} rounded-xl shadow-2xl p-4 ${isLatest ? 'border-2 border-indigo-500/30' : 'border border-gray-700/30'} backdrop-blur-sm`}
			style={{ minHeight: 160 }} // Match the loading state height
		>
			{isLatest ? (
				<>
					<div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl" />
					<div className="absolute -top-0.5 -left-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 rounded-br-lg rounded-tl-xl text-white text-sm font-medium">
						{'Latest Tournament'}
					</div>
					<div className="flex flex-col">
						<div className="flex justify-end">
							<Link
								href={`/tournaments/${tournament._id}`}
								className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/25"
							>
								{'View Latest Tournament →'}
							</Link>
						</div>
						<div className='pb-2'>
							<TournamentInfo tournament={tournament} />
						</div>
					</div>
				</>
			) : (
				<div className="font-medium flex justify-between items-center pb-2">
					<TournamentInfo tournament={tournament} />
					<Link
						href={`/tournaments/${tournament._id}`}
						className="px-3 py-1 text-sm font-medium text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-all duration-300 hover:border-indigo-500/50"
					>
						{'View Tournament →'}
					</Link>
				</div>
			)}

			<div className="grid grid-cols-1">
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
						<PlacementDisplay
							place={1}
							standing={allStandings.find(s => s.placement === 1)}
							isCurrentUser={allStandings.find(s => s.placement === 1)?.user === currentUserId}
						/>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 gap-2">
							{[2, 3].map((place) => (
								<PlacementDisplay
									key={place}
									place={place}
									standing={allStandings.find(s => s.placement === place)}
									isCurrentUser={allStandings.find(s => s.placement === place)?.user === currentUserId}
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
					<AnimatePresence initial={!defaultExpanded}>
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
										userScore={tournament.userStanding?.score}
									/>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2">
									{isLoadingStandings ? (
										Array(chunk1Count).fill(0).map((_, idx) => (
											<div key={idx} className="animate-pulse bg-gray-800 rounded-lg h-28" />
										))
									) : (
										allStandings.sort((a, b) => a.placement - b.placement).slice(TOP_PLACES, TOP_PLACES + chunk1Count).map((standing) => (
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
										Array(chunk2Count).fill(0).map((_, idx) => (
											<div key={idx} className="animate-pulse bg-gray-800 rounded-lg h-10" />
										))
									) : (
										allStandings.sort((a, b) => a.placement - b.placement).slice(SIMPLIFIED_DISPLAY_START, SIMPLIFIED_DISPLAY_START + chunk2Count).map((standing) => (
											<PlacementDisplay
												key={standing.user}
												place={standing.placement}
												standing={standing}
												isCurrentUser={standing.user === currentUserId}
												simpleStartIndex={FULL_DISPLAY_PLACES}
											/>
										))
									)}
								</div>

							</motion.div>
						)}
					</AnimatePresence>
					{!isLatest && (
						<button
							onClick={handleExpand}
							className="w-full border-t border-gray-700/30 mt-3 pt-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300"
						>
							<span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
							<div className="w-4 h-4">
								{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
							</div>
						</button>
					)}
				</div>
			</div>
		</div >
	)
}

const TournamentInfo = ({ tournament }: { tournament: TournamentType }) => (
	<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-400 text-sm">
		<div className="flex items-center gap-2">
			<span title={`Created: ${formatDate(tournament.createdAt)}`}>
				{formatDate(tournament.createdAt)}
			</span>
			<span className="text-gray-500/80" title="Tournament execution time">
				{'('}{formatDuration(tournament.tournamentExecutionTime)}{')'}
			</span>
		</div>
		<span className="text-gray-500/80" title="Number of submissions">
			{tournament.submissionCount}{' submissions'}
		</span>
	</div>
)
