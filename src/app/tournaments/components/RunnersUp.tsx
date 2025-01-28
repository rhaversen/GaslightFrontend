import { ISubmission, TournamentWinner, UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useEffect, useState } from 'react'
import LoadingPlaceholderSmall from '@/components/LoadingPlaceholderSmall'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const formatScore = (score: number) => score.toFixed(2)
const formatZScore = (z: number) => `Z-Score: ${z.toFixed(3)}`

const useNames = (userId?: string, submissionId?: string) => {
	const [userName, setUserName] = useState<string>('')
	const [submissionName, setSubmissionName] = useState<string>('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!userId || !submissionId) return

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
	winner?: TournamentWinner,
}) => {
	const { userName, submissionName, loading } = useNames(winner?.user, winner?.submission)

	return (
		<div className="bg-gray-700 p-2 rounded-lg">
			<div className={`text-xs ${place === 2 ? 'text-sky-100' : 'text-amber-500'} mb-1`}>{place === 2 ? '2nd Place' : '3rd Place'}</div>
			{winner ? (
				<div className="grid grid-cols-2 text-sm">
					<div className="flex flex-col items-start">
						<span title={userName}>
							{'User: '}{loading ? <LoadingPlaceholderSmall /> : userName}
						</span>
						<span title={submissionName}>
							{'Submission: '}{loading ? <LoadingPlaceholderSmall /> : submissionName}
						</span>
					</div>
					<div className="flex flex-col items-start">
						<span title={`Score: ${formatScore(winner.grade)}`}>
							{'Score: '}{formatScore(winner.grade)}
						</span>
						<span title={formatZScore(winner.zValue)}>
							{'z: '}{winner.zValue}
						</span>
					</div>
				</div>
			) : (
				<div className="text-gray-400">{'None'}</div>
			)}
		</div>
	)
}
