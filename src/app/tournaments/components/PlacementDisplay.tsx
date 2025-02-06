import { TournamentStanding } from '@/types/backendDataTypes'
import Link from 'next/link'

const getPlaceStyles = (place: number) => {
	switch (place) {
		case 1:
			return {
				border: 'border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-yellow-500/10',
				text: 'text-yellow-400',
				bg: 'bg-yellow-500/10',
				placeGlow: 'place-glow first-place-glow'
			}
		case 2:
			return {
				border: 'border-sky-500/20 hover:border-sky-500/40 hover:shadow-sky-500/10',
				text: 'text-sky-300',
				bg: 'bg-sky-500/10',
				placeGlow: 'place-glow second-place-glow'
			}
		case 3:
			return {
				border: 'border-orange-800/20 hover:border-orange-800/40 hover:shadow-orange-800/10',
				text: 'text-orange-400',
				bg: 'bg-orange-800/10',
				placeGlow: 'place-glow third-place-glow'
			}
		default:
			return {
				border: 'border-gray-600/20 hover:border-gray-600/30',
				text: 'text-gray-400',
				bg: 'bg-blue-500/20',
				placeGlow: 'place-glow default-place-glow'
			}
	}
}

const getPlaceText = (place: number) => {
	switch (place) {
		case 1: return 'Winner'
		case 2: return '2nd Place'
		case 3: return '3rd Place'
		default: return `${place}th Place`
	}
}

export const PlacementDisplay = ({
	place,
	standing,
	isCurrentUser,
	simpleStartIndex
}: {
	place: number,
	standing?: TournamentStanding,
	isCurrentUser: boolean,
	simpleStartIndex?: number
}) => {
	const placeStyles = getPlaceStyles(place)
	const isSimplified = simpleStartIndex != null && place >= simpleStartIndex

	if (isSimplified) {
		return (
			<div className="text-sm">
				<span className="font-medium text-gray-400">{`${place}. `}</span>
				<Link href={`/users/${standing?.user}`}>
					<span className={`text-gray-400 hover:text-sky-300/90 transition-colors ${isCurrentUser ? 'text-blue-300 font-medium' : ''}`}>
						{standing?.userName}
					</span>
				</Link>
				<span className="text-gray-500 ml-2">
					{standing ? `${(standing.statistics.normalizedScore * 100).toFixed(1)}%` : '0'}
				</span>
				{isCurrentUser && place > 3 && (
					<span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
						{'You !'}
					</span>
				)}
			</div>
		)
	}

	if (!standing) {
		return (
			<div
				className={`
					bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-2.5 rounded-xl
					border transition-all duration-300 shadow-lg relative
					${placeStyles.border}
				`}
			>
				<div className={`text-xs font-medium uppercase tracking-wider mb-1.5 ${placeStyles.text}`}>
					{getPlaceText(place)}
				</div>
				<div className="text-gray-400">{'None'}</div>
			</div>
		)
	}

	return (
		<div
			className={`
				bg-gradient-to-br from-gray-700/90 to-gray-800/90 rounded-xl
				border transition-all duration-300 shadow-lg relative
				${placeStyles.border}
				${isCurrentUser ? placeStyles.placeGlow : ''}
				${place === 1 ? 'p-6' : 'p-3'}
			`}
		>
			<h3 className={`
				font-semibold uppercase tracking-wider flex items-center gap-2 
				${placeStyles.text} 
				${place === 1 ? 'text-lg mb-4' : 'text-xs mb-2'}
			`}>
				{getPlaceText(place)}
				{isCurrentUser && (
					<span className={`${place === 1 ? 'text-sm' : 'text-[10px]'} px-1.5 py-0.5 rounded-full ${placeStyles.bg}`}>
						{'You !'}
					</span>
				)}
			</h3>

			<div className={place === 1 ? 'space-y-6' : 'grid grid-cols-1 sm:grid-cols-[60%_40%] gap-2'}>
				<div className="space-y-1.5">
					<div className={`${place === 1 ? 'text-xl' : ''}`}>
						<Link href={`/users/${standing.user}`}>
							<span className="text-gray-100 hover:text-yellow-200 transition-colors" title={standing.userName}>
								{standing.userName}
							</span>
						</Link>
						<span className="text-gray-500">{' with '}</span>
						<Link href={`/submissions/${standing.submission}`}>
							<span className={`${place === 1 ? 'text-lg' : 'text-sm'} text-gray-300 hover:text-yellow-200 transition-colors`} title={standing.submissionName}>
								{standing.submissionName}
							</span>
						</Link>
					</div>
				</div>

				{place === 1 && (
					<div className="grid grid-cols-4 gap-6 pt-2">
						<div className="space-y-1" title="Relative standing among all participants">
							<div className="text-sm text-gray-400">{'Score'}</div>
							<div className="text-2xl text-gray-200">{standing.statistics.percentileRank.toFixed(1)}{'%'}</div>
						</div>
						<div className="space-y-1" title="Average scored per game">
							<div className="text-sm text-gray-400">{'Raw Score'}</div>
							<div className="text-xl text-gray-300">{standing.score.toFixed(3)}</div>
						</div>
						<div className="space-y-1" title="Total number of syntax tokens in the strategy code. Each token represents a basic programming element like a keyword, operator, or identifier.">
							<div className="text-sm text-gray-400">{'Strategy Tokens'}</div>
							<div className="text-xl text-gray-300">{standing.tokenCount}</div>
						</div>
						<div className="space-y-1" title="Average time taken to execute the strategy">
							<div className="text-sm text-gray-400">{'Execution time'}</div>
							<div className="text-xl text-gray-300">{standing.avgExecutionTime.toFixed(2)}{'ms'}</div>
						</div>
					</div>
				)}

				{place > 1 && place <= 3 && (
					<div className="grid grid-cols-2 gap-6 pt-2">
						<div className="space-y-1" title="Relative standing among all participants">
							<div className="text-sm text-gray-400">{'Score'}</div>
							<div className="text-md text-gray-200">{standing.statistics.percentileRank.toFixed(1)}{'%'}</div>
						</div>
						<div className="space-y-1" title="Average scored per game">
							<div className="text-sm text-gray-400">{'Raw Score'}</div>
							<div className="text-sm text-gray-300">{standing.score.toFixed(3)}</div>
						</div>
					</div>
				)}

				{place > 3 && (
					<div className="grid grid-cols-2 gap-6 pt-2">
						<div className="space-y-1" title="Relative standing among all participants">
							<div className="text-sm text-gray-400">{'Score'}</div>
							<div className="text-sm text-gray-200">{standing.statistics.percentileRank.toFixed(1)}{'%'}</div>
						</div>
						<div className="space-y-1" title="Average scored per game">
							<div className="text-sm text-gray-400">{'Raw Score'}</div>
							<div className="text-sm text-gray-300">{standing.score.toFixed(3)}</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
