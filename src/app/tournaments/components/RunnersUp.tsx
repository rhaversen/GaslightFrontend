import { ISubmission, TournamentStanding, UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useEffect, useState } from 'react'
import LoadingPlaceholderSmall from '@/components/LoadingPlaceholderSmall'
import { formatScore, formatZScore } from '@/lib/scoreUtils'

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
		<div className={`clickable bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-3 rounded-xl
			border transition-all duration-300 shadow-lg cursor-pointer
			${place === 2 
			? 'border-sky-500/20 hover:border-sky-500/30 hover:shadow-sky-500/10' 
			: 'border-amber-500/20 hover:border-amber-500/30 hover:shadow-amber-500/10'
		}`}
		onClick={() => winner && console.log(`Navigate to ${place}nd place submission:`, winner.submission)}>
			<div className={`text-xs font-medium uppercase tracking-wider mb-2 
				${place === 2 ? 'text-sky-300' : 'text-amber-400'}`}>
				{place === 2 ? '2nd Place' : '3rd Place'}
			</div>
			{winner ? (
				<div className="grid grid-cols-2 text-sm gap-3">
					<div className="flex flex-col space-y-1">
						<div className="text-gray-200">
							{'User: '}
							<span 
								className="font-medium cursor-pointer hover:text-sky-200 transition-colors inline-block
									border-b border-sky-500/30 hover:border-sky-500" 
								onClick={(e) => {
									e.stopPropagation()
									console.log('Navigate to user:', winner.user)
								}}
								title={userName}>
								{loading ? <LoadingPlaceholderSmall /> : userName}
							</span>
						</div>
						<div className="text-gray-300 text-xs">
							{'Submission: '}
							<span 
								className="cursor-pointer hover:text-sky-200 transition-colors inline-block
									border-b border-sky-500/30 hover:border-sky-500"
								onClick={(e) => {
									e.stopPropagation()
									console.log('Navigate to submission:', winner.submission)
								}}
								title={submissionName}>
								{loading ? <LoadingPlaceholderSmall /> : submissionName}
							</span>
						</div>
					</div>
					<div className="flex flex-col space-y-1">
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
