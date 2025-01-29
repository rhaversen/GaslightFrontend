import { ISubmission, TournamentStanding, UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useEffect, useState } from 'react'
import LoadingPlaceholderSmall from '@/components/LoadingPlaceholderSmall'
import { formatScore, formatZScore } from '@/lib/scoreUtils'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const useNames = (userId?: string, submissionId?: string) => {
	const [userName, setUserName] = useState<string>('')
	const [submissionName, setSubmissionName] = useState<string>('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (userId === undefined || userId === '' || submissionId === undefined || submissionId === '') return

		const fetchNames = async () => {
			setLoading(true)
			try {
				const [userRes, subRes] = await Promise.all([
					axios.get<UserType>(`${API_URL}/v1/users/${userId}`),
					axios.get<ISubmission>(`${API_URL}/v1/submissions/${submissionId}`)
				])
				setUserName(userRes.data.username)
				setSubmissionName(subRes.data.title)
			} catch (error) {
				console.error('Failed to fetch names:', error)
				setUserName(userId)
				setSubmissionName(submissionId)
			}
			setLoading(false)
		}

		fetchNames()
	}, [userId, submissionId])

	return { userName, submissionName, loading }
}

export const RunnerUpDisplay = ({
	place,
	winner,
}: {
	place: number,
	winner?: TournamentStanding,
}) => {
	const { userName, submissionName, loading } = useNames(winner?.user, winner?.submission)

	return (
		<div
			className={`
				bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-2.5 rounded-xl
				border transition-all duration-300 shadow-lg
				${
		winner
			? place === 2
				? 'border-sky-500/20 hover:border-sky-500/30 hover:shadow-sky-500/10'
				: 'border-amber-500/20 hover:border-amber-500/30 hover:shadow-amber-500/10'
			: 'border-gray-700/30'
		}
			`}
		>
			<div className={`text-xs font-medium uppercase tracking-wider mb-1.5 
				${place === 2 ? 'text-sky-300' : 'text-amber-400'}`}>
				{place === 2 ? '2nd Place' : '3rd Place'}
			</div>
			{winner ? (
				<div className="grid grid-cols-1 sm:grid-cols-[60%_40%] text-sm gap-2">
					<div className="flex flex-col space-y-0.5">
						<div>
							<Link href={`/users/${winner?.user}`}>
								<span
									className="
										text-gray-200
										hover:text-sky-200 transition-colors
									"
									title={userName}
								>
									{loading ? <LoadingPlaceholderSmall /> : userName}
								</span>
							</Link>
							<span className="text-gray-600">{' with '}</span>
							<Link href={`/submissions/${winner?.submission}`}>
								<span
									className="
										text-xs text-gray-300
										hover:text-sky-200 transition-colors
									"
									title={submissionName}
								>
									{loading ? <LoadingPlaceholderSmall /> : submissionName}
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
