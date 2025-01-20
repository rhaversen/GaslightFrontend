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

	// Unauthenticated buttons
	const authenticatedButtonsLeft: Record<string, string> = {
		'Overall Ranking': '/',
		'Last Tournament': '/'
	}
	const authenticatedButtonsRight: Record<string, string> = {
		Profile: '/user/' + currentUser?._id
	}

	// Authenticated buttons
	const unauthenticatedButtonsLeft: Record<string, string> = {
		'Overall Ranking': '/',
		'Last Tournament': '/'
	}
	const unauthenticatedButtonsRight: Record<string, string> = {
		'Log in': '/login',
		'Sign Up': '/signup'
	}

	if (!mounted) {
		return <div className='p-5 absolute'></div> // Return empty container while mounting
	}

	const buttonsLeft = currentUser !== null ? authenticatedButtonsLeft : unauthenticatedButtonsLeft
	const buttonsRight = currentUser !== null ? authenticatedButtonsRight : unauthenticatedButtonsRight

	return (
		<div className='p-5 absolute flex justify-between w-full'>
			<div className='flex'>
				{Object.entries(buttonsLeft).map(([title, path]) => (
					<Button key={title} title={title} path={path} />
				))}
			</div>
			<div className='flex'>
				{Object.entries(buttonsRight).map(([title, path]) => (
					<Button key={title} title={title} path={path} />
				))}
			</div>
		</div>
	)
}

export default Header
