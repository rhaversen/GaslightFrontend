'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const defaultCode = `const main = (api: MeyerStrategyAPI) => {
	// YOUR CODE HERE

	// This is an example strategy
	// It will make some naive decisions based on the current state of the game
	// You can use this as a starting point for your own strategy or write your own from scratch

	// If we're first in the round, we need to roll
	if (api.isFirstInRound()) {
		api.roll()
		// We can't make any more actions the first turn, so we return
		return
	}

	// Get previous announced values
	const lastScores = api.getPreviousActions()

	// If the last score is a pair or larger, reveal
	if (lastScores !== null && lastScores[0] >= 100) {
		api.reveal()
		// We can't make any more actions after revealing, so we return
		return
	}

	// If the previous player called the same score as the player before them, reveal
	if (lastScores !== null && lastScores[0] === lastScores[1]) {
		api.reveal()
		return
	}

	// Roll the dice
	const currentScore = api.roll()

	// If our score is higher or equal, finish the turn
	if (lastScores === null || currentScore >= lastScores[0]) {
		return
	}

	// If our score is lower, we can either lie or call "det eller derover"
	if (Math.random() > 0.5) {
		api.lie(lastScores[0])
		// We cant make any more actions after lying
	} else {
		api.detEllerDerover()
		// We cant make any more actions after calling "det eller derover"
	}
}

// END CODE
export default main
`

export default function NewStrategy ({ params }: { params: { userId: string } }): JSX.Element {
	const router = useRouter()
	const [title, setTitle] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const handleCreate = async (): Promise<void> => {
		if (title.trim() === '') {
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
			router.push(`/users/${params.userId}/strategies/${response.data._id}`)
		} catch (error) {
			console.error('Error creating strategy:', error)
			setError('Failed to create strategy. Please try again.')
			setIsSubmitting(false)
		}
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-4xl p-6">
				<div className="flex flex-wrap items-center justify-between gap-4 m-8">
					<Link
						href={`/users/${params.userId}/strategies`}
						className="text-gray-600 hover:text-gray-900 transition-all hover:scale-105"
					>
						<span className="inline-flex items-center">
							<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
							</svg>
							{'Back\r'}
						</span>
					</Link>
					<h1 className="w-full sm:w-auto sm:flex-1 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center order-last sm:order-none pb-2">
						{'Create Strategy\r'}
					</h1>
					<div className="w-[100px]"></div>
				</div>

				<div className="space-y-8">
					<div>
						<label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
							{'Strategy Title\r'}
						</label>
						<input
							id="title"
							type="text"
							className="w-full p-4 border border-gray-200 text-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
							value={title}
							onChange={(e) => { setTitle(e.target.value) }}
							onKeyDown={(e) => { if (e.key === 'Enter') { void handleCreate() } }}
							placeholder="Enter a title for your strategy"
						/>
					</div>

					{error.length > 0 && (
						<div className="text-red-500 text-sm bg-red-50 p-4 rounded-lg border border-red-100">
							{error}
						</div>
					)}

					<div className="flex items-center gap-4">
						<button
							onClick={() => { void handleCreate() }}
							disabled={isSubmitting || title.trim().length === 0}
							className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:hover:scale-100"
						>
							{isSubmitting ? 'Creating...' : 'Create Strategy'}
						</button>
						<Link
							href={`/users/${params.userId}/strategies`}
							className="text-gray-600 hover:text-gray-900 transition-colors"
						>
							{'Cancel\r'}
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}
