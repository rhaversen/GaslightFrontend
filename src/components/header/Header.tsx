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
		<header className="p-6 absolute w-full z-10">
			<nav className="max-w-7xl mx-auto backdrop-blur-sm bg-white/10 rounded-2xl p-4 flex justify-between items-center shadow-lg">
				<div className="flex gap-4">
					{Object.entries(buttonsLeft).map(([title, path]) => (
						<Button
							key={title}
							title={title}
							path={path}
						/>
					))}
				</div>
				<div className="flex gap-4">
					{Object.entries(buttonsRight).map(([title, path]) => (
						<Button
							key={title}
							title={title}
							path={path}
						/>
					))}
				</div>
			</nav>
		</header>
	)
}

export default Header
