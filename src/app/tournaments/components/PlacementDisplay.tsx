import { TournamentStanding } from '@/types/backendDataTypes'
import { formatScore, formatZScore } from '@/lib/scoreUtils'
import Link from 'next/link'

const getPlaceStyles = (place: number) => {
	switch(place) {
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
				bg: 'bg-gray-500/10',
				placeGlow: ''
			}
	}
}

const getPlaceText = (place: number) => {
	switch(place) {
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
			<div className="text-sm text-gray-400">
				<span className="font-medium">{`${place}. `}</span>
				<Link href={`/users/${standing?.user}`}>
					<span className={`${isCurrentUser ? 'text-blue-300 font-medium' : ''}`}>
						{standing?.userName}
					</span>
				</Link>
				<span className="text-gray-500 ml-2">
					{standing?.grade.toFixed(2) ?? 0}
				</span>
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
				bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-3 rounded-xl
				border transition-all duration-300 shadow-lg relative
				${placeStyles.border}
				${isCurrentUser ? placeStyles.placeGlow : ''}
			`}
		>
			<h3 className={`text-xs font-semibold mb-2 uppercase tracking-wider flex items-center gap-2 ${placeStyles.text}`}>
				{getPlaceText(place)}
				{isCurrentUser && (
					<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${placeStyles.bg}`}>
						{'You !'}
					</span>
				)}
			</h3>

			<div className="grid grid-cols-1 sm:grid-cols-[60%_40%] gap-2">
				<div className="space-y-1.5">
					<div>
						<Link href={`/users/${standing.user}`}>
							<span className="text-gray-100 hover:text-yellow-200 transition-colors" title={standing.userName}>
								{standing.userName}
							</span>
						</Link>
						<span className="text-gray-500">{' with '}</span>
						<Link href={`/submissions/${standing.submission}`}>
							<span className="text-sm text-gray-300 hover:text-yellow-200 transition-colors" title={standing.submissionName}>
								{standing.submissionName}
							</span>
						</Link>
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<div className="text-gray-200" title={`Score: ${standing.grade}`}>
						{formatScore(standing.grade)}
					</div>
					<div className="text-gray-400 text-sm" title={`Z-Score: ${standing.zValue}`}>
						{formatZScore(standing.zValue)}
					</div>
				</div>
			</div>

			{place <= 3 && (
				<div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm mt-3">
					<div className="flex items-center justify-between">
						<span className="text-gray-400">{'Percentile Rank:'}</span>
						<span className="text-gray-300">{standing.statistics.percentileRank.toFixed(1)}{'%'}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-gray-400">{'Standard Score:'}</span>
						<span className="text-gray-300">{standing.statistics.standardScore.toFixed(2)}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-gray-400">{'Deviations:'}</span>
						<span className="text-gray-300">{standing.statistics.deviationsFromMean.toFixed(2)}{'σ'}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-gray-400">{'Normalized:'}</span>
						<span className="text-gray-300">{(standing.statistics.normalizedScore * 100).toFixed(1)}{'%'}</span>
					</div>
				</div>
			)}
		</div>
	)
}
