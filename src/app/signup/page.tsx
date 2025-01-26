'use client'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import { type UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import PasswordInput from '@/components/PasswordInput'
import { VisibilityOffIcon, VisibilityIcon } from '@/lib/icons'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()
	const { setCurrentUser } = useUser()
	const [formError, setFormError] = useState('')
	const [showPasswords, setShowPasswords] = useState(false)
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: ''
	})
	const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null)
	const isFormValid = formData.email.length > 0 && formData.password.length >= 4 && (passwordsMatch ?? false)

	const signup = useCallback(async (userData: any) => {
		try {
			const response = await axios.post<{
				auth: boolean
				user: UserType
			}>(`${API_URL}/v1/users`, {
				email: userData.email,
				password: userData.password,
				confirmPassword: userData.confirmPassword
			}, { withCredentials: true })
			setCurrentUser(response.data.user)
			router.push('/')
		} catch (error: any) {
			setCurrentUser(null)
			if (error.response?.status === 401) {
				setFormError('User already exists but the password is incorrect')
				return
			}
			addError(error)
		}
	}, [API_URL, addError, router, setCurrentUser])

	useEffect(() => {
		axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
			.then(() => { router.push('/') })
			.catch(() => { /* Do nothing */ })
	}, [API_URL, router])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const newFormData = {
			...formData,
			[e.target.name]: e.target.value
		}
		setFormData(newFormData)

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

	const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setFormError('')

		if (!(passwordsMatch ?? false)) {
			setFormError(formData.password.length < 4
				? 'Password must be at least 4 characters long'
				: 'Passwords do not match')
			return
		}

		signup(formData)
			.catch((error) => {
				setFormError('Failed to create account. Please try again.')
				addError(error)
			})
	}, [addError, signup, formData, passwordsMatch])

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-md p-4">
				<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center pb-2 mb-8">
					{'Create Account'}
				</h1>
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
					<form className="p-6 space-y-6" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<label htmlFor="email" className="block text-sm font-medium text-gray-700">
								{'Email address'}
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								autoComplete="email"
								className="block w-full text-gray-700 px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required />
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label htmlFor="password" className="block text-sm font-medium text-gray-700">
									{'Password (minimum 4 characters)'}
								</label>
								<button
									type="button"
									onClick={() => { setShowPasswords(!showPasswords) }}
									className="text-sm text-blue-500 hover:text-blue-600"
								>
									{showPasswords ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</button>
							</div>
							<PasswordInput
								name="password"
								value={formData.password}
								placeholder="Password"
								onChange={handleInputChange}
								inputType={showPasswords ? 'text' : 'password'}
								borderColor={
									passwordsMatch === false
										? 'border-red-500'
										: passwordsMatch === true ? 'border-green-500' : ''
								}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
								{'Confirm Password'}
							</label>
							<PasswordInput
								name="confirmPassword"
								value={formData.confirmPassword}
								placeholder="Confirm password"
								onChange={handleInputChange}
								inputType={showPasswords ? 'text' : 'password'}
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
						</div>

						<button
							type="submit"
							disabled={!isFormValid}
							className={`w-full px-4 py-2 text-white rounded-lg transition-colors
								${isFormValid ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' : 'bg-blue-300 cursor-not-allowed'}`}
						>
							{'Sign up'}
						</button>
					</form>

					{/* Messages */}
					{(formError.length > 0) && (
						<div className="border-t border-gray-100 px-6 py-4">
							{(formError.length > 0) && <p className="text-red-500 text-sm text-center">{formError}</p>}
						</div>
					)}
				</div>
				<div className="flex justify-center flex-col items-center mt-5 space-y-2">
					<p className="text-sm text-gray-600">
						{'Already have an account?'}{' '}
						<button type="button" onClick={() => { router.push('/login') }}
							className="font-medium text-indigo-600 hover:text-indigo-900">
							{'Log in\r'}
						</button>
					</p>
					<button type="button" onClick={() => { router.push('/') }}
						className="text-sm text-indigo-600 hover:text-indigo-900">
						{'Back to home'}
					</button>
				</div>
			</div>
		</main>
	)
}
