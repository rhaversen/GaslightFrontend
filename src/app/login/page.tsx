'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

import PasswordInput from '@/components/PasswordInput'
import { useUser } from '@/contexts/UserProvider'
import { VisibilityOffIcon, VisibilityIcon } from '@/lib/icons'
import { type UserType } from '@/types/backendDataTypes'

export default function Page (): ReactElement<any> {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { refetchUser } = useUser()
	const [formError, setFormError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [formData, setFormData] = useState({
		email: '',
		password: ''
	})

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		})
	}

	const isFormValid = formData.email.length > 0 && formData.password.length >= 4

	const login = useCallback(async (credentials: any) => {
		await axios.post<{
			auth: boolean
			user: UserType
		}>(`${API_URL}/v1/auth/login-user-local`, credentials, { withCredentials: true })
		await refetchUser() // Refetch to update the user context

		const canGoBack = () => {
			try {
				if (!document.referrer) { return false }
				const referrerUrl = new URL(document.referrer)
				return window.location.href !== document.referrer &&
					   referrerUrl.origin === window.location.origin
			} catch {
				return false
			}
		}

		if (canGoBack()) {
			router.back()
		} else {
			router.push('/')
		}
	}, [API_URL, router, refetchUser])

	useEffect(() => {
		axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
			.then(() => { router.push('/') })
			.catch(() => { /* Do nothing */ })
	}, [API_URL, router])

	const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault() // Prevent default form submission
		setFormError('')
		setIsSubmitting(true)

		const formData = new FormData(event.currentTarget)
		const credentials = {
			email: formData.get('email'),
			password: formData.get('password'),
			stayLoggedIn: formData.get('stayLoggedIn') === 'on' // Convert on to boolean
		}
		login(credentials)
			.catch((error) => {
				console.error(error)
				setFormError('Invalid email or password')
				setIsSubmitting(false)
			})
	}, [login])

	return (
		<main className="container mx-auto max-w-md p-4">
			<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center pb-2 mb-8">
				{'Log In'}
			</h1>
			<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
				<form className="p-6 space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<label htmlFor="email" className="block text-sm font-medium text-gray-700">
							{'Email address'}
						</label>
						<input type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleInputChange}
							autoComplete="username"
							className="block text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							required
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label htmlFor="password" className="block text-sm font-medium text-gray-700">
								{'Password'}
							</label>
							<button
								type="button"
								onClick={() => { setShowPassword(!showPassword) }}
								className="text-sm text-blue-500 hover:text-blue-600"
							>
								{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
							</button>
						</div>
						<PasswordInput
							name="password"
							value={formData.password}
							placeholder="Password"
							onChange={handleInputChange}
							inputType={showPassword ? 'text' : 'password'}
						/>
					</div>
					<div className="space-y-2">
						<label htmlFor="stayLoggedIn" className="flex items-center">
							<input type="checkbox" id="stayLoggedIn" name="stayLoggedIn"
								className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
							<span className="ml-2 block text-sm text-gray-900">
								{'Stay logged in'}
							</span>
						</label>
					</div>
					<div>
						<button
							type="submit"
							disabled={isSubmitting || !isFormValid}
							className={`w-full px-4 py-2 text-white rounded-lg transition-colors
									${(isSubmitting || !isFormValid) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
						>
							{isSubmitting ? 'Logging in...' : 'Log in'}
						</button>
					</div>
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
					{'Don\'t have an account?'}{' '}
					<button type="button" onClick={() => { router.push('/signup') }}
						className="font-medium text-indigo-600 hover:text-indigo-900">
						{'Sign up\r'}
					</button>
				</p>
				<button type="button" onClick={() => { router.push('/') }}
					className="text-sm text-indigo-600 hover:text-indigo-900">
					{'Back to home'}
				</button>
			</div>
		</main>
	)
}
