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

export const WinnerDisplay = ({ winner }: { winner: TournamentStanding }) => {
	const { userName, submissionName, loading } = useNames(winner.user, winner.submission)

	return (
		<div 
			className="clickable bg-gradient-to-br from-gray-700/90 to-gray-800/90 p-4 rounded-xl
				border border-yellow-500/20 shadow-lg transition-all duration-300
				hover:shadow-yellow-500/10 hover:border-yellow-500/30 cursor-pointer"
			onClick={() => console.log('Navigate to winner submission:', winner.submission)}>
			<h3 className="text-yellow-400 text-sm font-semibold mb-2 uppercase tracking-wider">
				{'Winner'}
			</h3>
			<div className="space-y-2">
				<div className="text-gray-100">
					{'User: '}
					<span 
						className="font-medium cursor-pointer hover:text-yellow-200 transition-colors inline-block
							border-b border-yellow-500/30 hover:border-yellow-500" 
						onClick={(e) => {
							e.stopPropagation()
							console.log('Navigate to user:', winner.user)
						}}
						title={userName}>
						{loading ? <LoadingPlaceholderSmall /> : userName}
					</span>
				</div>
				<div className="text-gray-200" title={`First Place Score: ${winner.grade}`}>
					{formatScore(winner.grade)}
					<span className="text-gray-400 text-sm ml-2" title={`Z-Score: ${winner.zValue}`}>
						{formatZScore(winner.zValue)}
					</span>
				</div>
				<div className="text-gray-300 text-sm">
					{'Submission: '}
					<span 
						className="cursor-pointer hover:text-yellow-200 transition-colors inline-block
							border-b border-yellow-500/30 hover:border-yellow-500"
						onClick={(e) => {
							e.stopPropagation()
							console.log('Navigate to submission:', winner.submission)
						}}
						title={submissionName}>
						{loading ? <LoadingPlaceholderSmall /> : submissionName}
					</span>
				</div>
			</div>
		</div>
	)
}
