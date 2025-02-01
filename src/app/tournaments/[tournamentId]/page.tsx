'use client'

import { useUser } from '@/contexts/UserProvider'
import { TournamentStatistics, type TournamentType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useEffect, useState, use, useCallback } from 'react'
import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import { formatDate } from '@/lib/dateUtils'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const STANDINGS_PER_PAGE = 100

export default function Page(props: { params: Promise<{ tournamentId: string }> }): ReactElement {
	const params = use(props.params)
	const { currentUser } = useUser()
	const router = useRouter()
	
	const [tournament, setTournament] = useState<TournamentType | null>(null)
	const [statistics, setStatistics] = useState<TournamentStatistics | null>(null)
	const [standings, setStandings] = useState<TournamentType['standings']>([])
	
	const [tournamentLoading, setTournamentLoading] = useState(true)
	const [statisticsLoading, setStatisticsLoading] = useState(true)
	const [standingsLoading, setStandingsLoading] = useState(true)
	
	const [sortField, setSortField] = useState<'submissionName' | 'userName' | 'grade' | 'zValue' | 'statistics.percentileRank'>('grade')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
	const [hasMore, setHasMore] = useState(true)
	const [page, setPage] = useState(1)

	const handleSort = (field: typeof sortField) => {
		if (sortField === field) {
			setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('desc')
		}
	}

	const getSortedStandings = (standings: TournamentType['standings']) => {
		return [...standings].sort((a, b) => {
			let aValue = sortField === 'statistics.percentileRank' ? a.statistics.percentileRank : a[sortField]
			let bValue = sortField === 'statistics.percentileRank' ? b.statistics.percentileRank : b[sortField]
			
			if (typeof aValue === 'string') {
				return sortDirection === 'asc' 
					? aValue.localeCompare(bValue as string)
					: (bValue as string).localeCompare(aValue)
			}
			
			return sortDirection === 'asc' 
				? (aValue as number) - (bValue as number)
				: (bValue as number) - (aValue as number)
		})
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
				amount: STANDINGS_PER_PAGE,
				skip: (page - 1) * STANDINGS_PER_PAGE
			}
		})
			.then(response => {
				setStandings(prev => 
					page === 1 
						? response.data 
						: [...prev, ...response.data]
				)
				setHasMore(response.data.length === STANDINGS_PER_PAGE)
			})
			.catch(error => console.error('Error fetching standings:', error))
			.finally(() => setStandingsLoading(false))
	}, [params.tournamentId, page])

	const loadMore = useCallback(() => {
		if (!standingsLoading && hasMore) {
			setPage(p => p + 1)
		}
	}, [standingsLoading, hasMore])

	const infiniteScrollRef = useInfiniteScroll(loadMore, standingsLoading, hasMore)

	if (tournamentLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
				<LoadingPlaceholder />
			</div>
		)
	}

	if (tournament === null) {
		return <div>{'Tournament not found'}</div>
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
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

			{/* Tournament details */}
			<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
				{/* Left column - Tournament Stats */}
				<div className="space-y-6">
					<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-6 rounded-xl border border-indigo-500/30">
						<h2 className="text-xl font-medium text-gray-200 mb-4">{'Tournament Statistics'}</h2>
						{statisticsLoading ? (
							<LoadingPlaceholder variant="dark"/>
						) : statistics && (
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
						)}
					</div>

					<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-6 rounded-xl border border-indigo-500/30">
						<h2 className="text-xl font-medium text-gray-200 mb-4">{'All Submissions'}</h2>
						<div className="grid grid-cols-1 gap-2">
							{/* Header */}
							<div className="grid grid-cols-[2fr_1fr_100px_100px_100px_100px] gap-2 text-sm text-gray-400 font-medium p-2">
								<button
									onClick={() => handleSort('submissionName')}
									className="text-left hover:text-gray-200 transition-colors flex items-center gap-1"
								>
									{'Submission\r'}
									{sortField === 'submissionName' && (
										<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
									)}
								</button>
								<button
									onClick={() => handleSort('userName')}
									className="text-left hover:text-gray-200 transition-colors flex items-center gap-1"
								>
									{'User\r'}
									{sortField === 'userName' && (
										<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
									)}
								</button>
								<div className="text-right">{'Tokens'}</div>
								<button
									onClick={() => handleSort('grade')}
									className="text-right hover:text-gray-200 transition-colors flex items-center justify-end gap-1"
								>
									{'Score\r'}
									{sortField === 'grade' && (
										<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
									)}
								</button>
								<button
									onClick={() => handleSort('zValue')}
									className="text-right hover:text-gray-200 transition-colors flex items-center justify-end gap-1"
								>
									{'Z-Score\r'}
									{sortField === 'zValue' && (
										<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
									)}
								</button>
								<button
									onClick={() => handleSort('statistics.percentileRank')}
									className="text-right hover:text-gray-200 transition-colors flex items-center justify-end gap-1"
								>
									{'Percentile\r'}
									{sortField === 'statistics.percentileRank' && (
										<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
									)}
								</button>
							</div>
							
							{/* Standings */}
							{getSortedStandings(standings).map((standing) => (
								<div 
									key={standing.user}
									className="grid grid-cols-[2fr_1fr_100px_100px_100px_100px] gap-2 bg-gray-800/50 rounded-lg p-2 items-center hover:bg-gray-800/70 transition-colors"
								>
									<Link 
										href={`/submissions/${standing.submission}`}
										className="text-gray-300 hover:text-sky-300 transition-colors truncate"
										title={standing.submissionName}
									>
										{standing.submissionName}
									</Link>
									<div className="text-gray-400 truncate" title={standing.userName}>
										{standing.userName}
									</div>
									<div className="text-right text-gray-400">{standing.tokenCount}</div>
									<div className="text-right text-gray-300">{standing.grade.toFixed(3)}</div>
									<div className="text-right text-gray-400">{standing.zValue.toFixed(2)}</div>
									<div className="text-right text-gray-400">
										{(standing.statistics.percentileRank).toFixed(1)}{'%\r'}
									</div>
								</div>
							))}

							{standingsLoading && (
								<div className="animate-pulse bg-gray-800/50 rounded-lg p-2 h-10"/>
							)}

							<div ref={infiniteScrollRef} className="h-px w-full" />
						</div>
					</div>
				</div>

				{/* Right column - Tournament Info */}
				<div className="space-y-6">
					<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-6 rounded-xl border border-indigo-500/30">
						<h2 className="text-xl font-medium text-gray-200 mb-4">{'Your Standing'}</h2>
						{tournament.userStanding ? (
							<div className="space-y-4">
								<div className="text-3xl text-gray-100 font-medium">
									{'#'}{tournament.userStanding.placement}
								</div>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">{'Score'}</span>
										<span className="text-gray-200">{tournament.userStanding.grade.toFixed(3)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">{'Z-Score'}</span>
										<span className="text-gray-200">{tournament.userStanding.zValue.toFixed(3)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">{'Percentile'}</span>
										<span className="text-gray-200">
											{tournament.userStanding.statistics.percentileRank.toFixed(1)}{'%\r'}
										</span>
									</div>
								</div>
							</div>
						) : (
							<div className="text-gray-400">
								{currentUser ? 'You did not participate in this tournament' : 'Login to view your standing'}
							</div>
						)}
					</div>

					<div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-6 rounded-xl border border-indigo-500/30">
						<h2 className="text-xl font-medium text-gray-200 mb-4">{'Disqualifications'}</h2>
						<div className="space-y-2 max-h-[300px] overflow-y-auto">
							{tournament.disqualified && tournament.disqualified.length > 0 ? (
								tournament.disqualified.map((dq, index) => (
									<div key={index} className="text-sm">
										<span className="text-red-400">{'#'}{dq.submission.slice(-6)}</span>
										<span className="text-gray-400 ml-2">{dq.reason}</span>
									</div>
								))
							) : (
								<div className="text-gray-400">{'No disqualifications'}</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
