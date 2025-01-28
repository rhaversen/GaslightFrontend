'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/contexts/UserProvider'
import { useState, useEffect } from 'react'
import { useLogout } from '@/hooks/useLogout'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { type UserType } from '@/types/backendDataTypes'

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface NavLinkProps {
	href: string
	children: React.ReactNode
	isActive: boolean
}

const NavLink = ({ href, children, isActive }: NavLinkProps) => (
	<Link
		href={href}
		className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
			isActive
				? 'border-blue-500 text-blue-600 bg-blue-50'
				: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
		}`}
	>
		<AnimatePresence mode="wait">
			<motion.div
				key={children?.toString()}
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: -20, opacity: 0 }}
				transition={{ duration: 0.3 }}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	</Link>
)

interface NavigationLinksProps {
	user: UserType
	pathname: string
	currentUser: UserType | null
}

const NavigationLinks = ({ user, pathname, currentUser }: NavigationLinksProps) => (
	<motion.div
		initial={{ opacity: 0, position: 'absolute' }}
		animate={{ opacity: 1, position: 'static' }}
		exit={{ opacity: 0, position: 'absolute' }}
		transition={{ duration: 0.3 }}
		style={{ display: 'flex' }}
	>
		<NavLink href={`/users/${user._id}`} isActive={pathname === `/users/${user._id}`}>
			{user === currentUser ? 'Your Profile\r' : `${user.username}'s Profile`}
		</NavLink>
		<NavLink href={`/users/${user._id}/strategies`} isActive={pathname === `/users/${user._id}/strategies`}>
			{user === currentUser ? 'Your Strategies\r' : `${user.username}'s Strategies`}
		</NavLink>
	</motion.div>
)

export default function Header(): React.JSX.Element {
	const pathname = usePathname()
	const { currentUser } = useUser()
	const { logout } = useLogout()
	const [isLoading, setIsLoading] = useState(true)
	const [isMounted, setIsMounted] = useState(false)
	const [viewedUser, setViewedUser] = useState<UserType | null>(null)
	const userIdFromPath = pathname.split('/')[2]
	const isCurrentUserPage = currentUser && currentUser._id === userIdFromPath

	// Client-side initialization
	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		const fetchUserData = async () => {
			if (userIdFromPath && (isCurrentUserPage === false)) {
				try {
					const response = await axios.get<UserType>(
						`${API_URL}/v1/users/${userIdFromPath}`,
						{ withCredentials: true }
					)
					setViewedUser(response.data)
				} catch (error) {
					console.error('Error fetching user:', error)
				}
			} else {
				setViewedUser(null)
			}
			setIsLoading(false)
		}

		void fetchUserData()
	}, [userIdFromPath, isCurrentUserPage])

	// Don't render anything until client-side hydration is complete
	if (!isMounted) {
		return <nav className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 shadow-sm">
			<div className="container mx-auto px-4 flex justify-between">
				<div className="flex items-center space-x-2" />
				<div className="flex overflow-hidden items-center justify-center relative" />
				<div className="flex items-center" />
			</div>
		</nav>
	}

	return (
		<nav className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 shadow-sm">
			<div className="container mx-auto px-4 flex justify-between">
				<div className="flex items-center space-x-2">
					<Link
						href="/"
						className="flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
					>
						{'Home\r'}
					</Link>
				</div>

				<div className="flex overflow-hidden items-center justify-center relative">
					<div className="transition-all duration-300 ease-in-out flex items-center">
						<div className="flex-shrink-0">
							{currentUser && 
								<NavLink href="/users" isActive={pathname === '/users'}>
									{'Users\r'}
								</NavLink>
							}
						</div>
						<div className="relative flex transition-all duration-300 ease-in-out">
							<AnimatePresence mode="sync">
								{isLoading && currentUser && (
									<NavigationLinks 
										user={currentUser} 
										pathname={pathname}
										currentUser={currentUser}
									/>
								)}
								{!isLoading && viewedUser && (
									<NavigationLinks 
										user={viewedUser} 
										pathname={pathname}
										currentUser={currentUser}
									/>
								)}
								{!isLoading && !viewedUser && currentUser && (
									<NavigationLinks 
										user={currentUser} 
										pathname={pathname}
										currentUser={currentUser}
									/>
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>

				<div className="flex items-center">
					{currentUser && (
						<button
							onClick={logout}
							className="flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
						>
							{'Logout\r'}
						</button>
					)}
				</div>
			</div>
		</nav>
	)
}
