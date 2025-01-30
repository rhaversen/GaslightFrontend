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

export const WinnerDisplay = ({ 
	winner, 
	isCurrentUser 
}: { 
	winner: TournamentStanding; 
	isCurrentUser: boolean 
}) => {
	const { userName, submissionName, loading } = useNames(winner.user, winner.submission)

	return (
		<div 
			className={`
				bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-3 rounded-xl
				border border-yellow-500/20 shadow-lg transition-all duration-300
				hover:shadow-yellow-500/10 hover:border-yellow-500/40
				relative
				${isCurrentUser ? 'place-glow first-place-glow' : ''}
			`}
		>
			<h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-yellow-400 flex items-center gap-2">
				{'Winner'}
				{isCurrentUser && (
					<span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 rounded-full">{'You !'}</span>
				)}
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-[60%_40%] gap-2">
				<div className="space-y-1.5">
					<div>
						<Link href={`/users/${winner.user}`}>
							<span
								className="
									text-gray-100
									hover:text-yellow-200 transition-colors
								"
								title={userName}
							>
								{loading ? <LoadingPlaceholderSmall /> : userName}
							</span>
						</Link>
						<span className="text-gray-500">{' with '}</span>
						<Link href={`/submissions/${winner.submission}`}>
							<span
								className="
									text-sm text-gray-300
									hover:text-yellow-200 transition-colors
								"
								title={submissionName}
							>
								{loading ? <LoadingPlaceholderSmall /> : submissionName}
							</span>
						</Link>
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<div className="text-gray-200" title={`First Place Score: ${winner.grade}`}>
						{formatScore(winner.grade)}
					</div>
					<div className="text-gray-400 text-sm" title={`Z-Score: ${winner.zValue}`}>
						{formatZScore(winner.zValue)}
					</div>
				</div>
			</div>
		</div>
	)
}
