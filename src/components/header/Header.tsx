'use client'

import React, { type ReactElement, useState, useEffect } from 'react'
import Button from './Button'
import { useUser } from '@/contexts/UserProvider'
import { useLogout } from '@/hooks/useLogout'

const Header = (): ReactElement<any> => {
	const { currentUser } = useUser()
	const [mounted, setMounted] = useState(false)
	const { logout } = useLogout()

	useEffect(() => {
		setMounted(true)
	}, [])

	type ButtonProps = Record<string, {
		path?: string
		onClick?: () => void
	}>

	// Unauthenticated buttons
	const authenticatedButtonsLeft: ButtonProps = {
		Users: { path: '/users' },
		Tournaments: { path: '/tournaments' }
	}
	const authenticatedButtonsRight: ButtonProps = {
		Profile: { path: '/users/' + currentUser?._id },
		Logout: { onClick: logout }
	}

	// Authenticated buttons
	const unauthenticatedButtonsLeft: ButtonProps = {
		Users: { path: '/users' },
		Tournaments: { path: '/tournaments' }
	}
	const unauthenticatedButtonsRight: ButtonProps = {
		'Log in': { path: '/login' },
		'Sign Up': { path: '/signup' }
	}

	if (!mounted) {
		return <div className='p-5 absolute'></div> // Return empty container while mounting
	}

	const buttonsLeft = currentUser !== null ? authenticatedButtonsLeft : unauthenticatedButtonsLeft
	const buttonsRight = currentUser !== null ? authenticatedButtonsRight : unauthenticatedButtonsRight

	return (
		<header className="p-2 sm:p-4 md:p-6 absolute w-full z-10">
			<nav className="max-w-7xl mx-auto backdrop-blur-sm bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-4 flex justify-between items-center shadow-lg">
				<div className="flex gap-1 sm:gap-2 md:gap-4">
					{Object.entries(buttonsLeft).map(([title, config]) => (
						<Button
							key={title}
							title={title}
							path={config.path}
							onClick={config.onClick}
						/>
					))}
				</div>
				<div className="flex gap-1 sm:gap-2 md:gap-4">
					{Object.entries(buttonsRight).map(([title, config]) => (
						<Button
							key={title}
							title={title}
							path={config.path}
							onClick={config.onClick}
						/>
					))}
				</div>
			</nav>
		</header>
	)
}

export default Header
