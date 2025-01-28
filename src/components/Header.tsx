'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/contexts/UserProvider'
import { useState, useEffect } from 'react'
import LoadingPlaceholder from './LoadingPlaceholder'

export default function Header(): React.JSX.Element {
	const pathname = usePathname()
	const { currentUser } = useUser()
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		setIsLoading(false)
	}, [])

	if (isLoading) {
		return <LoadingPlaceholder />
	}

	return (
		<nav className="bg-white border-b border-gray-200">
			<div className="container mx-auto px-4">
				<div className="flex overflow-x-auto">
					<Link
						href="/users"
						className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
							pathname === '/users'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						{'Users\r'}
					</Link>
					{currentUser !== null && (
						<>
							<Link
								href={`/users/${currentUser._id}`}
								className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
									pathname === `/users/${currentUser._id}`
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								{'Your Profile\r'}
							</Link>
							<Link
								href={`/users/${currentUser._id}/strategies`}
								className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
									pathname === `/users/${currentUser._id}/strategies`
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								{'Your Strategies\r'}
							</Link>
						</>
					)}
				</div>
			</div>
		</nav>
	)
}
