'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const defaultCode = `const main = (api: MeyerStrategyAPI) => {
	// If we're first in the round, we need to roll
	if (api.isFirstInRound()) {
		api.roll()
		return
	}

	// Randomly reveal
	if (Math.random() > 0.5) {
		api.reveal()
		return
	}

	// Get previous announced value
	const lastScore = api.getPreviousAction()

	// Roll the dice
	const currentScore = api.roll()

	// If our score is higher or equal, finish the turn
	if (lastScore === null || currentScore >= lastScore) {
		return
	}

	// If our score is lower, we can either lie or call "det eller derover"
	if (Math.random() > 0.5) {
		api.lie(lastScore)
	} else {
		api.detEllerDerover()
	}
}

export default main
`

export default function NewStrategy ({ params }: { params: { userId: string } }): JSX.Element {
	const router = useRouter()
	const [title, setTitle] = useState('New Strategy')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const handleCreate = async (): Promise<void> => {
		if (title.trim() === '') {
			setError('Title cannot be empty')
			return
		}

		setIsSubmitting(true)
		setError('')

		try {
			const response = await axios.post(
				`${API_URL}/v1/submissions`,
				{ title, code: defaultCode },
				{ withCredentials: true }
			)
			router.push(`/user/${params.userId}/strategies/${response.data._id}`)
		} catch (error) {
			console.error('Error creating strategy:', error)
			setError('Failed to create strategy. Please try again.')
			setIsSubmitting(false)
		}
	}

	return (
		<main className="container mx-auto p-6 max-w-4xl">
			<div className="bg-white shadow-lg rounded-lg p-6">
				<div className="flex items-center justify-between mb-8">
					<Link
						href={`/user/${params.userId}/strategies`}
						className="text-gray-600 hover:text-gray-800 transition-colors"
					>
						<span className="inline-flex items-center">
							<svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
							</svg>
							{'Back to Strategies\r'}
						</span>
					</Link>
					<h1 className="text-3xl font-bold text-gray-800">{'Create New Strategy'}</h1>
					<div className="w-[135px]"></div>
				</div>

				<div className="space-y-6">
					<div>
						<label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
							{'Strategy Title\r'}
						</label>
						<input
							id="title"
							type="text"
							className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
							value={title}
							onChange={(e) => { setTitle(e.target.value) }}
							placeholder="Enter a title for your strategy"
						/>
					</div>

					{(error.length > 0) && (
						<div className="text-red-600 text-sm">
							{error}
						</div>
					)}

					<div className="flex items-center gap-4">
						<button
							onClick={() => { void handleCreate() }}
							disabled={isSubmitting}
							className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
						>
							{isSubmitting ? 'Creating...' : 'Create Strategy'}
						</button>
						<Link
							href={`/user/${params.userId}/strategies`}
							className="text-gray-600 hover:text-gray-800 transition-colors"
						>
							{'Cancel\r'}
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}
