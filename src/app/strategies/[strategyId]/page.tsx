'use client'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, ReactElement, use } from 'react'

import { useUser } from '@/contexts/UserProvider'
import { SubmissionType, GameType } from '@/types/backendDataTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function StrategyPage (props: { params: Promise<{ strategyId: string }> }): ReactElement<any> {
	const { strategyId } = use(props.params)
	const { currentUser } = useUser()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [submission, setSubmission] = useState<SubmissionType | null>(null)
	const [game, setGame] = useState<GameType | null>(null)

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			setIsLoading(true)
			try {
				const { data: submissionData } = await axios.get<SubmissionType>(`${API_URL}/v1/submissions/${strategyId}`, {
					withCredentials: true
				})
				setSubmission(submissionData)

				const { data: gameData } = await axios.get<GameType>(`${API_URL}/v1/games/${submissionData.game}`, {
					withCredentials: true
				})
				setGame(gameData)
			} catch (err) {
				console.error('Error fetching strategy details:', err)
				setError('Failed to load strategy details.')
			} finally {
				setIsLoading(false)
			}
		}
		void fetchData()
	}, [strategyId])

	if (isLoading) {
		return (
			<div className="w-full flex justify-center p-5">
				<p>{'Loading...'}</p>
			</div>
		)
	}

	if (error || !submission || !game) {
		return <p className="p-5 text-red-600">{error || 'Strategy not found.'}</p>
	}

	const isOwner = currentUser?._id === submission.user

	return (
		<main className="container mx-auto max-w-4xl p-6 bg-gray-50 text-gray-900 space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-4xl font-bold">{submission.title}</h1>
				{isOwner && (
					<Link
						href={`/strategies/${strategyId}/edit`}
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
					>
						{'Modify\r'}
					</Link>
				)}
			</div>

			{/* Game information */}
			<section className="border p-4 rounded">
				<h2 className="text-2xl font-semibold mb-2">{'Game Information'}</h2>
				<p><strong>{'Name:'}</strong> {game.name}</p>
			</section>

			{/* Navigation button */}
			<div>
				<button onClick={() => router.back()} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
					{'Back\r'}
				</button>
			</div>
		</main>
	)
}
