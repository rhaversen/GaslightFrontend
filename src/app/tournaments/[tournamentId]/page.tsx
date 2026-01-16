'use client'

import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useEffect, useState, use, useCallback } from 'react'

import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import { useUser } from '@/contexts/UserProvider'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { formatDate } from '@/lib/dateUtils'
import { TournamentStatistics, type TournamentType } from '@/types/backendDataTypes'

import { CurrentUserDisplay } from '../components/CurrentUserDisplay'
import { DisqualificationsDisplay } from '../components/DisqualificationsDisplay'
import { StatsDisplay } from '../components/StatsDisplay'

import { TournamentList } from './components/TournamentList'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const STANDINGS_PER_PAGE = 10

export default function Page (props: { params: Promise<{ tournamentId: string }> }): ReactElement {
	const params = use(props.params)
	const { currentUser } = useUser()
	const router = useRouter()

	const [tournament, setTournament] = useState<TournamentType | null>(null)
	const [statistics, setStatistics] = useState<TournamentStatistics | null>(null)
	const [standings, setStandings] = useState<TournamentType['standings']>([])

	const [tournamentLoading, setTournamentLoading] = useState(true)
	const [statisticsLoading, setStatisticsLoading] = useState(true)
	const [standingsLoading, setStandingsLoading] = useState(true)

	const [sortField, setSortField] = useState<'placement' | 'tokenCount' | 'avgExecutionTime'>('placement')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(1)

	const handleSort = (field: typeof sortField) => {
		if (sortField === field) {
			setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('desc')
		}
		// Reset pagination and trigger new fetch
		setPage(1)
		setStandings([])
	}

	// Fetch tournament with only user standing
	useEffect(() => {
		setTournamentLoading(true)
		axios.get(`${API_URL}/v1/tournaments/${params.tournamentId}`, {
			params: {
				userIdStanding: currentUser?._id,
				getStandings: false
			}
		})
			.then(response => setTournament(response.data))
			.catch(error => {
				console.error('Error fetching tournament:', error)
				router.push('/tournaments')
			})
			.finally(() => setTournamentLoading(false))
	}, [params.tournamentId, router, currentUser?._id])

	// Fetch statistics
	useEffect(() => {
		setStatisticsLoading(true)
		axios.get<TournamentStatistics>(`${API_URL}/v1/tournaments/${params.tournamentId}/statistics`)
			.then(response => setStatistics(response.data))
			.catch(error => console.error('Error fetching statistics:', error))
			.finally(() => setStatisticsLoading(false))
	}, [params.tournamentId])

	// Fetch paginated standings
	useEffect(() => {
		setStandingsLoading(true)
		axios.get(`${API_URL}/v1/tournaments/${params.tournamentId}/standings`, {
			params: {
				limitStandings: STANDINGS_PER_PAGE,
				skipStandings: (page - 1) * STANDINGS_PER_PAGE,
				sortFieldStandings: sortField,
				sortDirectionStandings: sortDirection
			}
		})
			.then(response => {
				setStandings(prev =>
					page === 1
						? response.data // Replace all data on first page
						: [...prev, ...response.data] // Append for subsequent pages
				)
				setHasMore(response.data.length === STANDINGS_PER_PAGE)
			})
			.catch(error => console.error('Error fetching standings:', error))
			.finally(() => setStandingsLoading(false))
	}, [params.tournamentId, page, sortField, sortDirection]) // Dependencies trigger refetchUser

	const loadMore = useCallback(() => {
		if (!standingsLoading && hasMore) {
			setPage(p => p + 1)
		}
	}, [standingsLoading, hasMore])

	const infiniteScrollRef = useInfiniteScroll(loadMore, standingsLoading, hasMore)

	if (tournamentLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
				<LoadingPlaceholder variant="dark" />
			</div>
		)
	}

	if (tournament === null) {
		return <div>{'Tournament not found'}</div>
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
			<div className="flex gap-6">
				<TournamentList selectedId={params.tournamentId} />
				<div className="flex-1">
					<div className="grid grid-cols-1 gap-6">
						{/* Top section with info */}
						<div className="space-y-6">
							{/* Back button and title */}
							<div className="flex items-center gap-4 mb-6">
								<Link
									href="/tournaments"
									className="px-3 py-1.5 text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:border-gray-600"
								>
									{'←'}<span className="ml-2">{'Back'}</span>
								</Link>
								<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
									{formatDate(tournament.createdAt)}
								</h1>
							</div>

							{/* Personal Info Section */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<CurrentUserDisplay
									standing={tournament.userStanding ?? null}
									isLoggedIn={Boolean(currentUser)}
								/>
								<DisqualificationsDisplay disqualified={tournament.disqualified} />
							</div>

							{/* Main Content */}
							<div className="space-y-6">
								{/* Tournament Statistics */}
								<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-6 rounded-xl border border-indigo-500/30">
									<h2 className="text-xl font-medium text-gray-200 mb-4">{'Tournament Statistics'}</h2>
									{statisticsLoading ? (
										<LoadingPlaceholder variant="dark" />
									) : statistics && (
										<div className="space-y-6">
											<StatsDisplay
												tournamentId={params.tournamentId}
												statistics={statistics}
												userScore={tournament.userStanding?.score}
											/>
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
												{[
													['Sample Size', statistics.sampleSize],
													['Arithmetic Mean', statistics.centralTendency.arithmeticMean.toFixed(3)],
													['Harmonic Mean', statistics.centralTendency.harmonicMean?.toFixed(3) ?? 'N/A'],
													['Mode', statistics.centralTendency.mode.map(m => m.toFixed(3)).join(', ')],
													['Median (P50)', statistics.percentiles.p50.toFixed(3)],
													['Standard Deviation', statistics.dispersion.standardDeviation.toFixed(3)],
													['Variance', statistics.dispersion.variance.toFixed(3)],
													['IQR', statistics.dispersion.interquartileRange.toFixed(3)],
													['Skewness', statistics.distribution.skewness?.toFixed(3) ?? 'N/A'],
													['Kurtosis', statistics.distribution.kurtosis?.toFixed(3) ?? 'N/A'],
													['Minimum', statistics.extrema.minimum.toFixed(3)],
													['Maximum', statistics.extrema.maximum.toFixed(3)],
													['Range', statistics.extrema.range.toFixed(3)],
													['10th Percentile', statistics.percentiles.p10.toFixed(3)],
													['90th Percentile', statistics.percentiles.p90.toFixed(3)]
												].map(([label, value]) => (
													<div key={label} className="space-y-1">
														<div className="text-sm text-gray-400">{label}</div>
														<div className="text-lg text-gray-200">{value}</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* All Submissions */}
						<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-6 rounded-xl border border-indigo-500/30">
							<h2 className="text-xl font-medium text-gray-200 mb-4">{'All Submissions'}</h2>
							<div className="grid grid-cols-1 gap-2">
								{/* Header */}
								<div className="grid grid-cols-[80px_1fr_1fr_90px_90px_100px_100px] gap-4 text-sm text-gray-400 font-medium p-2 divide-x divide-gray-600">
									<button
										onClick={() => handleSort('placement')}
										className="text-center hover:text-gray-200 transition-colors flex items-center justify-center gap-1"
									>
										{'Standing'}
										{sortField === 'placement' && (
											<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
										)}
									</button>
									<div className='text-center flex items-center justify-center gap-1'>{'User'}</div>
									<div className='text-center flex items-center justify-center gap-1'>{'Submission'}</div>
									<div
										className='text-center flex items-center justify-center gap-1'
										title="Relative standing among all participants"
									>
										{'Score'}
									</div>
									<div className='text-center flex items-center justify-center gap-1'
										title="Average scored per game"
									>
										{'Raw Score'}
									</div>
									<button
										onClick={() => handleSort('tokenCount')}
										className="text-center hover:text-gray-200 transition-colors flex items-center justify-center gap-1"
										title="Total number of syntax tokens in the strategy code. Each token represents a basic programming element like a keyword, operator, or identifier."
									>
										{'Tokens'}
										{sortField === 'tokenCount' && (
											<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
										)}
									</button>
									<button
										onClick={() => handleSort('avgExecutionTime')}
										className="text-center hover:text-gray-200 transition-colors flex items-center justify-center gap-1"
									>
										{'Time'}
										{sortField === 'avgExecutionTime' && (
											<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
										)}
									</button>
								</div>

								{/* Standings */}
								{standings.sort((a, b) => { // Sort standings based on sortField and sortDirection
									const aField = a[sortField]
									const bField = b[sortField]
									if (aField === bField) { return 0 }
									return (aField > bField ? 1 : -1) * (sortDirection === 'asc' ? 1 : -1)
								}).map(standing => (
									<div
										key={standing.user}
										className="grid grid-cols-[80px_1fr_1fr_90px_90px_100px_100px] gap-4 bg-gray-800/50 rounded-lg p-2 items-center hover:bg-gray-800/70 transition-colors divide-x divide-gray-600"
									>
										<div className="text-center">
											<span className="text-xl font-medium text-gray-300">{'#'}{standing.placement}</span>
										</div>
										<Link
											href={`/users/${standing.user}`}
											className="text-gray-400 hover:text-sky-300 transition-colors truncate pl-2"
											title={standing.userName}
										>
											{standing.userName}
										</Link>
										<Link
											href={`/strategies/${standing.submission}`}
											className="text-gray-300 hover:text-sky-300 transition-colors truncate pl-2"
											title={standing.submissionName}
										>
											{standing.submissionName}
										</Link>
										<div
											className="text-end"
											title="Relative standing among all participants"
										>
											<div className="text-xl text-gray-200">
												{standing.percentileRank.toFixed(1)}{'%'}
											</div>
										</div>
										<div className="text-end" title="Average scored per game">
											<div className="text-gray-400">
												{standing.score.toFixed(3)}
											</div>
										</div>
										<div
											className="text-center text-gray-400"
											title="Total number of syntax tokens in the strategy code. Each token represents a basic programming element like a keyword, operator, or identifier."
										>
											{standing.tokenCount}
										</div>
										<div className="text-center text-gray-400">
											{standing.avgExecutionTime.toFixed(2)}{'ms'}
										</div>
									</div>
								))}

								{standingsLoading && (
									<div className="animate-pulse bg-gray-800/50 rounded-lg p-2 h-10" />
								)}

								<div ref={infiniteScrollRef} className="h-px w-full" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
