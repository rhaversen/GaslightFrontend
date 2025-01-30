import { TournamentStanding } from '@/types/backendDataTypes'
import { formatScore, formatZScore } from '@/lib/scoreUtils'
import Link from 'next/link'

const getPlaceStyles = (place: number) => {
	switch(place) {
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
		case 4:
		case 5:
			return {
				border: 'border-purple-500/20 hover:border-purple-500/30 hover:shadow-purple-500/10',
				text: 'text-purple-300',
				bg: 'bg-purple-500/10',
				placeGlow: ''
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

export const RunnerUpDisplay = ({
	place,
	winner,
	isCurrentUser,
}: {
	place: number,
	winner?: TournamentStanding,
	isCurrentUser: boolean,
}) => {
	const placeStyles = getPlaceStyles(place)
	const isSimplified = place > 5

	if (isSimplified) {
		return (
			<div className="text-sm text-gray-400">
				<span className="font-medium">{`${place}. `}</span>
				<Link href={`/users/${winner?.user}`}>
					<span className={`${isCurrentUser ? 'text-blue-300 font-medium' : ''}`}>
						{winner?.userName}
					</span>
				</Link>
				<span className="text-gray-500 ml-2">
					{formatScore(winner?.grade ?? 0)}
				</span>
			</div>
		)
	}

	return (
		<div
			className={`
				bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-2.5 rounded-xl
				border transition-all duration-300 shadow-lg relative
				${placeStyles.border}
				${isCurrentUser ? placeStyles.placeGlow : ''}
			`}
		>
			<div className={`text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-2
				${placeStyles.text}`}>
				{place === 2 ? '2nd Place' : place === 3 ? '3rd Place' : `${place}th Place`}
				{isCurrentUser && (
					<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${placeStyles.bg}`}>
						{'You !'}
					</span>
				)}
			</div>
			{winner ? (
				<div className="grid grid-cols-1 sm:grid-cols-[60%_40%] text-sm gap-2">
					<div className="flex flex-col space-y-0.5">
						<div>
							<Link href={`/users/${winner.user}`}>
								<span
									className="
										text-gray-200
										hover:text-sky-200 transition-colors
									"
									title={winner.userName}
								>
									{winner.userName}
								</span>
							</Link>
							<span className="text-gray-600">{' with '}</span>
							<Link href={`/submissions/${winner.submission}`}>
								<span
									className="
										text-xs text-gray-300
										hover:text-sky-200 transition-colors
									"
									title={winner.submissionName}
								>
									{winner.submissionName}
								</span>
							</Link>
						</div>
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="text-gray-200" title={`Score: ${winner.grade}`}>
							{formatScore(winner.grade)}
						</span>
						<span className="text-gray-400 text-xs" title={`Z-Score: ${winner.zValue}`}>
							{formatZScore(winner.zValue)}
						</span>
					</div>
				</div>
			) : (
				<div className="text-gray-400">{'None'}</div>
			)}
		</div>
	)
}
