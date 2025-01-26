'use client'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useError } from './ErrorContext/ErrorContext'
import { useUser } from './UserProvider'

export default function UserAuthProvider ({ children }: Readonly<{ children: ReactNode }>): ReactNode {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()
	const { setCurrentUser } = useUser()
	const router = useRouter()

	const [currentSession, setCurrentSession] = useState<string | null>(null)

	const checkAuthentication = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<string>(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
			setCurrentSession(response.data)
		} catch {
			// If not authenticated, log out and redirect to login page
			setCurrentUser(null)
			setCurrentSession(null)
			await axios.post(`${API_URL}/v1/auth/logout-local`, { withCredentials: true })
			router.push('/login')
		}
	}, [API_URL, router, setCurrentUser])

	// Run the authentication and authorization checks on component mount
	useEffect(() => {
		if (currentSession === null) {
			checkAuthentication().catch(addError)
		}
	}, [currentSession, checkAuthentication, addError])

	return <>{children}</>
}
