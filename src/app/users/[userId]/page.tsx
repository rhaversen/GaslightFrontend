'use client'

import { useUser } from '@/contexts/UserProvider'
import { type UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import Link from 'next/link'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import { formatDate } from '@/lib/dateUtils'
import PasswordInput from '@/components/PasswordInput'
import { SettingsIcon, VisibilityOffIcon, VisibilityIcon } from '@/lib/icons'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function Page ({ params }: Readonly<{ params: { userId: string } }>): ReactElement {
	const { currentUser } = useUser()
	const [userData, setUserData] = useState<UserType | null>(null)
	const isOwnProfile = currentUser?._id === params.userId
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [username, setUsername] = useState<string>('')
	const [isEditingUsername, setIsEditingUsername] = useState(false)
	const [isEditingPassword, setIsEditingPassword] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		confirmPassword: ''
	})
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null)

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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const newFormData = {
			...formData,
			[e.target.name]: e.target.value
		}
		setFormData(newFormData)

		// Check password match and length when either password field changes
		if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
			if (newFormData.password === '' && newFormData.confirmPassword === '') {
				setPasswordsMatch(null)
			} else {
				const isLongEnough = newFormData.password.length >= 4
				const doPasswordsMatch = newFormData.password === newFormData.confirmPassword
				setPasswordsMatch(isLongEnough && doPasswordsMatch)
			}
		}
	}

	const handleSubmit = async (field: 'username' | 'password'): Promise<void> => {
		setError('')
		setSuccess('')

		try {
			const updateData: Record<string, string> = {}

			if (field === 'username' && (formData.username.length > 0)) {
				updateData.username = formData.username
			} else if (field === 'password' && (formData.password.length > 0)) {
				if (formData.password !== formData.confirmPassword) {
					setError('Passwords do not match')
					return
				}
				updateData.password = formData.password
				updateData.confirmPassword = formData.confirmPassword
			}

			const response = await axios.patch<UserType>(
				`${API_URL}/v1/users/${params.userId}`,
				updateData,
				{ withCredentials: true }
			)

			setUserData(response.data)
			setSuccess(`${field === 'username' ? 'Username' : 'Password'} updated successfully!`)
			if (field === 'username') {
				setIsEditingUsername(false)
			} else {
				setIsEditingPassword(false)
				setPasswordsMatch(null)
			}
			setFormData({ username: '', password: '', confirmPassword: '' })
		} catch (error) {
			setError('Failed to update profile. Please try again.')
			console.error('Error updating user:', error)
		}
	}

	if (isLoading) {
		return (
			<LoadingPlaceholder />
		)
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-2xl p-4">
				<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center pb-2 mb-8">
					{isOwnProfile ? 'Your Profile' : `${username}'s Profile`}
				</h1>
				{userData !== null && (
					<div className="space-y-8">
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
							{/* User Info Section */}
							<div className="p-6 space-y-3">
								{/* Basic Info Grid */}
								<div className="grid grid-cols-[120px,1fr] gap-y-3 text-sm">
									<div className="font-medium text-gray-500">{'Username'}</div>
									<div className="text-gray-900">{userData.username}</div>

									{userData.email !== null && (
										<>
											<div className="font-medium text-gray-500">{'Email'}</div>
											<div className="text-gray-900">{userData.email}</div>
										</>
									)}

									<div className="font-medium text-gray-500">{'Member since'}</div>
									<div className="text-gray-900">{formatDate(userData.createdAt)}</div>

									<div className="font-medium text-gray-500">{'Submissions'}</div>
									<div className="text-gray-900">{userData.submissionCount}</div>
								</div>

								{/* Modification Controls */}
								{isOwnProfile && (
									<div className="mt-6 flex flex-col gap-3 text-gray-700">
										{isEditingUsername
											? (
												<div className="flex items-center gap-2">
													<input
														type="text"
														name="username"
														value={formData.username}
														onChange={handleInputChange}
														placeholder={userData.username}
														className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
													/>
													<div className="flex gap-2">
														<button
															onClick={() => { void handleSubmit('username') }}
															className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
														>
															{'Save\r'}
														</button>
														<button
															onClick={() => {
																setIsEditingUsername(false)
																setFormData({ ...formData, username: '' })
															}}
															className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
														>
															{'Cancel\r'}
														</button>
													</div>
												</div>
											)
											: (
												<button
													onClick={() => { setIsEditingUsername(true) }}
													className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
												>
													<SettingsIcon />
													{'Modify Username\r'}
												</button>
											)}

										{isEditingPassword
											? (
												<div className="flex flex-col gap-3">
													<div className="flex items-center justify-between">
														<label className="text-sm font-medium text-gray-700">{'Password'}</label>
														<button
															onClick={() => { setShowPassword(!showPassword) }}
															className="text-sm text-blue-500 hover:text-blue-600"
														>
															{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
														</button>
													</div>
													<PasswordInput
														name="password"
														value={formData.password}
														placeholder="New password"
														onChange={handleInputChange}
														inputType={showPassword ? 'text' : 'password'}
														borderColor={
															passwordsMatch === false
																? 'border-red-500'
																: passwordsMatch === true ? 'border-green-500' : ''
														}
													/>
													<label className="text-sm font-medium text-gray-700">{'Confirm Password'}</label>
													<PasswordInput
														name="confirmPassword"
														value={formData.confirmPassword}
														placeholder="Confirm password"
														onChange={handleInputChange}
														inputType={showPassword ? 'text' : 'password'}
														borderColor={
															passwordsMatch === false
																? 'border-red-500'
																: passwordsMatch === true ? 'border-green-500' : ''
														}
													/>
													{passwordsMatch === false && (
														<span className="text-sm text-red-500">
															{formData.password.length < 4
																? 'Password must be at least 4 characters'
																: 'Passwords do not match'}
														</span>
													)}
													<div className="flex gap-2">
														<button
															onClick={() => { void handleSubmit('password') }}
															disabled={!(passwordsMatch ?? false)}
															className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors
																${(passwordsMatch ?? false) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`}
														>
															{'Update Password\r'}
														</button>
														<button
															onClick={() => {
																setIsEditingPassword(false)
																setPasswordsMatch(null)
																setFormData({ ...formData, password: '', confirmPassword: '' })
															}}
															className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
														>
															{'Cancel\r'}
														</button>
													</div>
												</div>
											)
											: (
												<button
													onClick={() => { setIsEditingPassword(true) }}
													className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
												>
													<SettingsIcon />
													{'Change Password\r'}
												</button>
											)}
									</div>
								)}
							</div>

							{/* Messages */}
							{((error.length > 0) || (success.length > 0)) && (
								<div className="border-t border-gray-100 px-6 py-4">
									{(error.length > 0) && <p className="text-red-500 text-sm text-center">{error}</p>}
									{(success.length > 0) && <p className="text-green-500 text-sm text-center">{success}</p>}
								</div>
							)}
						</div>

						{/* View Strategies Button */}
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
