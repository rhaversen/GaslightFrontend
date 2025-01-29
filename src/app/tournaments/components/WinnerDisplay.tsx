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
		<div className="bg-gray-700 p-3 rounded-lg">
			<h3 className="text-yellow-400 text-sm font-semibold mb-1">{'Winner'}</h3>
			<div className="space-y-1">
				<div title={userName}>
					{'User: '}{loading ? <LoadingPlaceholderSmall /> : userName}
				</div>
				<div title={`First Place Score: ${winner.grade}`}>
					{formatScore(winner.grade)}
					<span className="text-gray-300 text-sm ml-2" title={`Z-Score: ${winner.zValue}`}>
						{formatZScore(winner.zValue)}
					</span>
				</div>
				<div title={submissionName}>
					{'Submission: '}{loading ? <LoadingPlaceholderSmall /> : submissionName}
				</div>
			</div>
		</div>
	)
}
