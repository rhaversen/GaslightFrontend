'use client'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import { type UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect } from 'react'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()
	const { setCurrentUser } = useUser()

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
			addError(error)
		}
	}, [API_URL, addError, router, setCurrentUser])

	useEffect(() => {
		axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
			.then(() => { router.push('/') })
			.catch(() => { /* Do nothing */ })
	}, [API_URL, router])

	const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)
		const userData = {
			email: formData.get('email'),
			password: formData.get('password'),
			confirmPassword: formData.get('confirm-password')
		}
		signup(userData).catch(addError)
	}, [addError, signup])

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
			<form className="w-full max-w-sm flex flex-col justify-between space-y-5" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<label htmlFor="email" className="block text-sm font-medium text-gray-700">
						{'Email address'}
					</label>
					<input type="email" id="email" name="email" autoComplete="email"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required />
				</div>
				<div className="space-y-2">
					<label htmlFor="password" className="block text-sm font-medium text-gray-700">
						{'Password'}
					</label>
					<input type="password" id="password" name="password" autoComplete="new-password"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required />
				</div>
				<div className="space-y-2">
					<label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
						{'Confirm Password'}
					</label>
					<input type="password" id="confirm-password" name="confirm-password" autoComplete="new-password"
						className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						required />
				</div>
				<div>
					<button type="submit"
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
						{'Sign up'}
					</button>
				</div>
			</form>
			<div className="flex justify-center flex-col items-center mt-5 space-y-2">
				<p className="text-sm text-gray-600">
					{'Already have an account?'}{' '}
					<button type="button" onClick={() => { router.push('/login') }}
						className="font-medium text-indigo-600 hover:text-indigo-900">
						{'Log in\r'}
					</button>
				</p>
				<p className="text-sm text-gray-600">
					<button type="button" onClick={() => { router.push('/') }}
						className="text-sm text-indigo-600 hover:text-indigo-900">
						{'Back to home'}
					</button>
				</p>
			</div>
		</main>
	)
}
