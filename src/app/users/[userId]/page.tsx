'use client'

import { useUser } from '@/contexts/UserProvider'
import { type UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingPlaceholder from '@/components/LoadingPlaceholder'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page ({ params }: Readonly<{ params: { userId: string } }>): ReactElement {
	const { currentUser } = useUser()
	const [userData, setUserData] = useState<UserType | null>(null)
	const isOwnProfile = currentUser?._id === params.userId
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [username, setUsername] = useState<string>('')

	useEffect(() => {
		setIsLoading(true)
		const fetchUser = async (): Promise<void> => {
			try {
				const response = await axios.get<UserType>(
					`${API_URL}/v1/users/${params.userId}`,
					{ withCredentials: true }
				)
				setUserData(response.data)
				setUsername(response.data.username ?? 'Unknown User')
			} catch (error) {
				console.error('Error fetching user:', error)
			} finally {
				setIsLoading(false)
			}
		}
		void fetchUser()
	}, [params.userId, isOwnProfile, router])

	if (isLoading) {
		return (
			<LoadingPlaceholder />
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-4xl p-2">
				<h1 className="w-full sm:w-auto sm:flex-1 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center order-last sm:order-none m-8 pb-2">
					{isOwnProfile ? 'Your Profile' : `${username}'s Profile`}
				</h1>
				{userData !== null && (
					<div className="space-y-6">
						<div className="p-6 rounded-xl border border-gray-100 shadow-sm">
							<div className="space-y-4">
								<p className="flex justify-between items-center text-gray-600">
									<span className="font-medium">{'Username'}</span>
									<span className="text-gray-900">{userData.username}</span>
								</p>
								{(userData.email !== null) && (
									<p className="flex justify-between items-center text-gray-600">
										<span className="font-medium">{'Email'}</span>
										<span className="text-gray-900">{userData.email}</span>
									</p>
								)}
								<p className="flex justify-between items-center text-gray-600">
									<span className="font-medium">{'Member since'}</span>
									<span className="text-gray-900">{new Date(userData.createdAt).toLocaleDateString()}</span>
								</p>
								<p className="flex justify-between items-center text-gray-600">
									<span className="font-medium">{'Submissions'}</span>
									<span className="text-gray-900">{userData.submissionCount}</span>
								</p>
							</div>
						</div>
						<div className="flex justify-center">
							<Link
								href={`/users/${params.userId}/strategies`}
								className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3
											 rounded-lg hover:scale-105 transition-all shadow-md inline-flex
											 items-center gap-2"
							>
								<span>{'View Strategies'}</span>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
								</svg>
							</Link>
						</div>
					</div>
				)}
			</div>
		</main>
	)
}
