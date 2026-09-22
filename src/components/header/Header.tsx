'use client'

import React, { type ReactElement, useState, useEffect } from 'react'

import { useUser } from '@/contexts/UserProvider'
import { useLogout } from '@/hooks/useLogout'

import Button from './Button'

const Header = (): ReactElement => {
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
		Explore: { path: '/explore' },
		Tournaments: { path: '/tournaments' }
	}
	const authenticatedButtonsRight: ButtonProps = {
		'New Strategy': { path: '/strategies/new' },
		Profile: { path: '/explore?focus=user/' + (currentUser?._id ?? '') },
		Logout: { onClick: logout }
	}

	// Authenticated buttons
	const unauthenticatedButtonsLeft: ButtonProps = {
		Explore: { path: '/explore' },
		Tournaments: { path: '/tournaments' }
	}
	const unauthenticatedButtonsRight: ButtonProps = {
		'Log in': { path: '/login' },
		'Sign Up': { path: '/signup' }
	}

	if (!mounted) {
		return <div className='p-10 sm:p-16 md:p-20'></div> // Return empty container while mounting
	}

	const buttonsLeft = currentUser !== null ? authenticatedButtonsLeft : unauthenticatedButtonsLeft
	const buttonsRight = currentUser !== null ? authenticatedButtonsRight : unauthenticatedButtonsRight

	return (
		<header className="p-2 sm:p-4 w-full z-10">
			<nav className="max-w-7xl mx-auto bg-surface/80 backdrop-blur border border-border rounded-xl px-3 py-2 flex justify-between items-center">
				<div className="flex gap-1 sm:gap-2">
					{Object.entries(buttonsLeft).map(([title, config]) => (
						<Button
							key={title}
							title={title}
							path={config.path}
							onClick={config.onClick}
						/>
					))}
				</div>
				<div className="flex gap-1 sm:gap-2">
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
