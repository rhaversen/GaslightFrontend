'use client'

import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import { formatDate } from '@/lib/dateUtils'
import { type UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page (): ReactElement {
	const [users, setUsers] = useState<UserType[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchUsers = async (): Promise<void> => {
			try {
				const response = await axios.get<UserType[]>(
					`${API_URL}/v1/users`,
					{ withCredentials: true }
				)
				console.log('response', response.data)
				setUsers(response.data)
			} catch (error) {
				console.error('Error fetching users:', error)
			} finally {
				setIsLoading(false)
			}
		}
		void fetchUsers()
	}, [])

	if (isLoading) {
		return <LoadingPlaceholder />
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-4xl p-2">
				<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center m-8 pb-2">
					{'Users\r'}
				</h1>
				<div className="grid gap-4">
					{users.map((user) => (
						<Link
							key={user._id}
							href={`/users/${user._id}`}
							className="p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
						>
							<div className="flex justify-between items-center">
								<div className="space-y-1">
									<h2 className="text-xl font-semibold text-gray-900">{user.username}</h2>
									<p className="text-sm text-gray-600">{'Submissions: '}{user.submissionCount}</p>
									{(user.activeSubmission != null)
										? (
											<p className="text-sm text-gray-600">{'Active Submission: '}{user.activeSubmission}</p>
										)
										: (
											<p className="text-sm text-gray-600">{'No active submission'}</p>
										)}
									<div className="text-xs text-gray-500">
										<p>{'Joined: '}{formatDate(user.createdAt)}</p>
									</div>
								</div>
								<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</Link>
					))}
				</div>
			</div>
		</main>
	)
}
