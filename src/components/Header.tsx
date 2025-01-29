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

const truncateText = (text: string, maxLength: number): string => {
	return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

interface NavLinkProps {
	href: string
	children: React.ReactNode
	isActive: boolean
}

const NavLink = ({ href, children, isActive }: NavLinkProps) => (
	<Link
		href={href}
		className={`flex items-center px-2 py-3 sm:px-2 md:px-3 lg:px-6 md:py-4 text-xs sm:text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
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
	user: UserType | null
	pathname: string
	currentUser: UserType | null
}

const NavigationLinks = ({ user, pathname, currentUser }: NavigationLinksProps) => {
	const isProfile = user ? pathname === `/users/${user._id}` : false
	const isStrategies = user ? pathname === `/users/${user._id}/strategies` : false
	const isCurrentUser = user === currentUser

	return (
		<motion.div
			initial={{ opacity: 0, position: 'absolute' }}
			animate={{ opacity: 1, position: 'static' }}
			exit={{ opacity: 0, position: 'absolute' }}
			transition={{ duration: 0.3 }}
			style={{ display: 'flex' }}
		>
			<div className={`${isProfile && !isCurrentUser ? 'hidden md:block' : ''}`}>
				<NavLink 
					href={user ? `/users/${user._id}` : '/login'} 
					isActive={isProfile}
				>
					{user ? (
						isCurrentUser ? (
							'Your Profile'
						) : (
							<>
								<span className="hidden sm:block md:hidden">
									{truncateText(user.username, 10)}{'\'s Profile\r'}
								</span>
								<span className="hidden md:block lg:hidden">
									{truncateText(user.username, 20)}{'\'s Profile\r'}
								</span>
								<span className="hidden lg:block">
									{truncateText(user.username, 30)}{'\'s Profile\r'}
								</span>
								<span className="sm:hidden">
									{truncateText(user.username, 8)}{'\'s Profile\r'}
								</span>
							</>
						)
					) : (
						'Your Profile'
					)}
				</NavLink>
			</div>
			<div className={`${isStrategies && !isCurrentUser ? 'hidden md:block' : ''}`}>
				<NavLink 
					href={user ? `/users/${user._id}/strategies` : '/login'} 
					isActive={isStrategies}
				>
					{user ? (
						isCurrentUser ? (
							'Your Strategies'
						) : (
							<>
								<span className="hidden sm:block md:hidden">
									{truncateText(user.username, 10)}{'\'s Strategies\r'}
								</span>
								<span className="hidden md:block lg:hidden">
									{truncateText(user.username, 20)}{'\'s Strategies\r'}
								</span>
								<span className="hidden lg:block">
									{truncateText(user.username, 30)}{'\'s Strategies\r'}
								</span>
								<span className="sm:hidden">
									{truncateText(user.username, 8)}{'\'s Strategies\r'}
								</span>
							</>
						)
					) : (
						'Your Strategies'
					)}
				</NavLink>
			</div>
		</motion.div>
	)
}

export default function Header(): React.JSX.Element {
	const pathname = usePathname()
	const { currentUser } = useUser()
	const { logout } = useLogout()
	const [isLoading, setIsLoading] = useState(true)
	const [isMounted, setIsMounted] = useState(false)
	const [viewedUser, setViewedUser] = useState<UserType | null>(null)
	const userIdFromPath = pathname.split('/')[2]
	const isCurrentUserPage = currentUser !== null && currentUser._id === userIdFromPath

	// Client-side initialization
	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		const fetchUserData = async () => {
			if (userIdFromPath && !isCurrentUserPage) {
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
			<div className="container mx-auto px-1 sm:px-1 md:px-2 lg:px-4 flex justify-between max-w-full">
				<div className="flex items-center space-x-1 sm:space-x-1 md:space-x-2">
					<Link
						href="/"
						className="flex items-center px-2 py-3 sm:px-2 md:px-3 lg:px-6 md:py-4 text-xs sm:text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-all border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
					>
						{'Home\r'}
					</Link>
				</div>

				<div className="flex overflow-hidden items-center justify-center relative">
					<div className="transition-all duration-300 ease-in-out flex items-center">
						<div className="flex-shrink-0">
							<NavLink href="/users" isActive={pathname === '/users'}>
								{'Users\r'}
							</NavLink>
						</div>
						<div className="relative flex transition-all duration-300 ease-in-out">
							<AnimatePresence mode="sync">
								{!currentUser && !viewedUser && (
									<NavigationLinks 
										user={null}
										pathname={pathname}
										currentUser={null}
									/>
								)}
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
							className="flex items-center px-2 py-3 sm:px-2 md:px-3 lg:px-6 md:py-4 text-xs sm:text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-all border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
						>
							{'Logout\r'}
						</button>
					)}
				</div>
			</div>
		</nav>
	)
}
