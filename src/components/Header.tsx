'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/contexts/UserProvider'
import { useState, useEffect } from 'react'
import LoadingPlaceholder from './LoadingPlaceholder'
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
		{children}
	</Link>
)

export default function Header(): React.JSX.Element {
	const pathname = usePathname()
	const { currentUser } = useUser()
	const { logout } = useLogout()
	const [isLoading, setIsLoading] = useState(true)
	const [viewedUser, setViewedUser] = useState<UserType | null>(null)
	const [placeholder, setPlaceholder] = useState<string | null>(null)
	const userIdFromPath = pathname.split('/')[2]
	const isCurrentUserPage = currentUser && currentUser._id === userIdFromPath

	useEffect(() => {
		const fetchUserData = async () => {
			if (userIdFromPath && !isCurrentUserPage) {
				setPlaceholder('Loading...')
				try {
					const response = await axios.get<UserType>(
						`${API_URL}/v1/users/${userIdFromPath}`,
						{ withCredentials: true }
					)
					setViewedUser(response.data)
					setPlaceholder(null)
				} catch (error) {
					console.error('Error fetching user:', error)
					setPlaceholder('User')
				}
			} else {
				setViewedUser(null)
				setPlaceholder(null)
			}
			setIsLoading(false)
		}

		void fetchUserData()
	}, [userIdFromPath, isCurrentUserPage])

	if (isLoading) {
		return <LoadingPlaceholder />
	}

	const getNavLinks = () => {
		if (userIdFromPath && !isCurrentUserPage) {
			return viewedUser ? (
				<>
					<NavLink href={`/users/${viewedUser._id}`} isActive={pathname === `/users/${viewedUser._id}`}>
						{`${viewedUser.username}'s Profile`}
					</NavLink>
					<NavLink href={`/users/${viewedUser._id}/strategies`} isActive={pathname === `/users/${viewedUser._id}/strategies`}>
						{`${viewedUser.username}'s Strategies`}
					</NavLink>
				</>
			) : (
				<>
					<NavLink href="#" isActive={false}>
						{`${placeholder}'s Profile`}
					</NavLink>
					<NavLink href="#" isActive={false}>
						{`${placeholder}'s Strategies`}
					</NavLink>
				</>
			)
		}
		
		if (currentUser && (!userIdFromPath || isCurrentUserPage)) {
			return (
				<>
					<NavLink href={`/users/${currentUser._id}`} isActive={pathname === `/users/${currentUser._id}`}>
						{'Your Profile\r'}
					</NavLink>
					<NavLink href={`/users/${currentUser._id}/strategies`} isActive={pathname === `/users/${currentUser._id}/strategies`}>
						{'Your Strategies\r'}
					</NavLink>
				</>
			)
		}

		return null
	}

	return (
		<nav className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 shadow-sm">
			<div className="container mx-auto px-4 flex justify-between">
				<div className="flex items-center space-x-2">
					<NavLink href="/" isActive={pathname === '/'}>
						{'Home\r'}
					</NavLink>
				</div>

				<div className="flex overflow-x-auto items-center justify-center relative">
					<NavLink href="/users" isActive={pathname === '/users'}>
						{'Users\r'}
					</NavLink>
					
					<AnimatePresence mode="wait">
						<motion.div
							key={userIdFromPath || 'default'}
							className="flex"
							initial={{ y: 50, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -50, opacity: 0 }}
							transition={{ duration: 0.3 }}
						>
							{getNavLinks()}
						</motion.div>
					</AnimatePresence>
				</div>

				<div className="flex items-center">
					<AnimatePresence>
						{currentUser && (
							<motion.div
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0, opacity: 0 }}
							>
								<button
									onClick={logout}
									className="flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
								>
									{'Logout\r'}
								</button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</nav>
	)
}
