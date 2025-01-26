'use client'

import { useUser } from '@/contexts/UserProvider'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useEffect } from 'react'

export default function Page (): ReactElement {
	const { currentUser } = useUser()
	const router = useRouter()

	useEffect(() => {
		if (currentUser !== null) {
			router.push(`/users/${currentUser._id}`)
		} else {
			router.push('/')
		}
	}, [currentUser, router])

	return <main>{'Redirecting...'}</main>
}
