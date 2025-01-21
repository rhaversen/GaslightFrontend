'use client'

import { useUser } from '@/contexts/UserProvider'
import { type UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page ({ params }: Readonly<{ params: { userId: string } }>): ReactElement {
	const { currentUser } = useUser()
	const [userData, setUserData] = useState<UserType | null>(null)
	const isOwnProfile = currentUser?._id === params.userId
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (!isOwnProfile) {
			router.push('/')
			return
		}

		setIsLoading(true)
		const fetchUser = async (): Promise<void> => {
			try {
				const response = await axios.get<UserType>(
					`${API_URL}/v1/users/${params.userId}`,
					{ withCredentials: true }
				)
				console.log('User data:', response.data)
				setUserData(response.data)
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
			<main className="container mx-auto p-6 max-w-4xl">
				<div className="bg-white shadow-lg rounded-lg p-6">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
						<div className="space-y-4">
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2"></div>
						</div>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="container mx-auto p-6 max-w-4xl">
			<div className="bg-white shadow-lg rounded-lg p-6">
				<h1 className="text-3xl font-bold mb-6 text-gray-800">{'User Profile'}</h1>
				{userData !== null && (
					<div className="space-y-4">
						<div className="bg-gray-50 p-4 rounded-md">
							<p className="text-gray-600">{'Username: '}<span className="font-semibold">{userData.username}</span></p>
							<p className="text-gray-600">{'Email: '}<span className="font-semibold">{userData.email}</span></p>
							<p className="text-gray-600">{'Member since: '}<span className="font-semibold">
								{new Date(userData.createdAt).toLocaleDateString()}
							</span></p>
						</div>
						<Link
							href={`/user/${params.userId}/strategies`}
							className="inline-block bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
						>
							{'View Strategies\r'}
						</Link>
					</div>
				)}
			</div>
		</main>
	)
}
