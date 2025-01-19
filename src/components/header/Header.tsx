'use client'

import React, { type ReactElement, useState, useEffect } from 'react'
import Button from './Button'
import { useUser } from '@/contexts/UserProvider'

const Header = (): ReactElement => {
	const { currentUser } = useUser()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const authenticatedButtons: Record<string, string> = {
		Profile: '/profile',
		'Overall Ranking': '/',
		'Last Tournament': '/'
	}

	const unauthenticatedButtons: Record<string, string> = {
		Login: '/login',
		'Sign Up': '/signup',
		'Overall Ranking': '/',
		'Last Tournament': '/'
	}

	if (!mounted) {
		return <div className='p-5 absolute'></div> // Return empty container while mounting
	}

	const buttons = currentUser !== null ? authenticatedButtons : unauthenticatedButtons

	return (
		<div className='p-5 absolute'>
			{Object.entries(buttons).map(([title, path]) => (
				<Button key={title} title={title} path={path} />
			))}
		</div>
	)
}

export default Header
