'use client'

import React, { useEffect, useState, useRef, type ReactElement } from 'react'
import { HaloCalm, HaloAgressive } from '../components/VantaBackground'
import Header from '@/components/header/Header'
import { useUser } from '@/contexts/UserProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import type { UserType } from '@/types/backendDataTypes'

export default function Page (): ReactElement<any> {
	// Time generation function
	const timeToNextMidnight = (): string => {
		const now = new Date()
		const nextMidnight = new Date(now)
		nextMidnight.setHours(24, 0, 0, 0)
		const diff = nextMidnight.getTime() - now.getTime()
		const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0')
		const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0')
		const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0')
		return `${hours} : ${minutes} : ${seconds}`
	}

	const timeSinceMidnight = (): string => {
		const now = new Date()
		const midnight = new Date(now)
		midnight.setHours(0, 0, 0, 0) // Set to previous midnight
		const diff = now.getTime() - midnight.getTime()
		const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0')
		const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0')
		const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0')
		return `${hours} : ${minutes} : ${seconds}`
	}

	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const [timeToTournamentString, setTimeToTournamentString] = useState('-- : -- : --')
	const [timeSinceTournamentString, setTimeSinceTournamentString] = useState('-- : -- : --')
	const { currentUser } = useUser()
	const userDataPromiseRef = useRef<Promise<any> | null>(null)
	const tournamentInProgress = false // TODO: fetch from backend

	// Start loading data on mount if user exists
	useEffect(() => {
		if ((currentUser?._id) != null) {
			userDataPromiseRef.current = axios.get<UserType>(`${API_URL}/v1/users/${currentUser._id}`)
				.catch(err => {
					console.error('Failed to fetch user data:', err)
					return null
				})
		}
	}, [currentUser, API_URL])

	useEffect(() => {
		setTimeToTournamentString(timeToNextMidnight())
		const interval = setInterval(() => {
			setTimeToTournamentString(timeToNextMidnight())
		}, 1000)
		return () => { clearInterval(interval) }
	}, [])

	useEffect(() => {
		setTimeSinceTournamentString(timeSinceMidnight())
		const interval = setInterval(() => {
			setTimeSinceTournamentString(timeSinceMidnight())
		}, 1000)
		return () => { clearInterval(interval) }
	}, [])

	const handleAmbigusClick = async (): Promise<void> => {
		// If user is not logged in, redirect to signup page
		if (currentUser == null) {
			router.push('/signup')
			return
		}

		try {
			let userData
			if (userDataPromiseRef.current != null) {
				userData = await userDataPromiseRef.current
			} else if (currentUser._id !== '') {
				userData = await axios.get<UserType>(`${API_URL}/v1/users/${currentUser._id}`)
			}

			if (userData?.data == null) {
				throw new Error('No user data available')
			}

			if (userData.data.submissionCount > 0) {
				router.push(`/users/${currentUser._id}/strategies`)
			} else {
				router.push(`/users/${currentUser._id}/strategies/new`)
			}
		} catch (error) {
			console.error('Failed to fetch user data:', error)
		}
	}

	return (
		<>
			<Header />
			<main className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
				{tournamentInProgress
					? (
						<>
							<HaloAgressive />
							<div className="z-10 text-center flex flex-col items-center gap-8">
								<div className='text-white text-xl font-medium tracking-wide'>
									{'TOURNAMENT IN PROGRESS\r'}
								</div>
								<div className='text-white text-4xl md:text-7xl font-light tracking-wider whitespace-nowrap'>
									{timeSinceTournamentString}
								</div>
								<button
									className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 px-10 py-4 rounded-xl
								text-white text-xl font-medium tracking-wide transform transition-all duration-300
								hover:scale-105 hover:shadow-[0_0_50px_rgba(167,139,250,1)]
								active:scale-95"
									onClick={() => { void handleAmbigusClick() }}
									type='button'
								>
									{'JOIN TOURNAMENT\r'}
								</button>
								<Link
									href="/tournament/results"
									className="border-2 m-1 sm:m-2 rounded-2xl md:rounded-full border-white transition duration-300 
									hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-110"
								>
									<div className='font-semibold p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base whitespace-nowrap'>
										{'SHOW LAST TOURNAMENT RESULTS\r'}
									</div>
								</Link>
							</div>
						</>
					)
					: (
						<>
							<HaloCalm />
							<div className="z-10 text-center flex flex-col items-center gap-8">
								<div className='text-white text-xl font-medium tracking-wide'>
									{'NEXT RANKED TOURNAMENT IN\r'}
								</div>
								<div className='text-white text-4xl md:text-7xl font-light tracking-wider whitespace-nowrap'>
									{timeToTournamentString}
								</div>
								<button
									className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 px-10 py-4 rounded-xl
								text-white text-xl font-medium tracking-wide transform transition-all duration-300
								hover:scale-105 hover:shadow-[0_0_50px_rgba(167,139,250,1)]
								active:scale-95"
									onClick={() => { void handleAmbigusClick() }}
									type='button'
								>
									{'JOIN TOURNAMENT\r'}
								</button>
								<Link
									href="/tournament/results"
									className="border-2 m-1 sm:m-2 rounded-2xl md:rounded-full border-white transition duration-300 
									hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-110"
								>
									<div className='font-semibold p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base whitespace-nowrap'>
										{'SHOW LAST TOURNAMENT RESULTS\r'}
									</div>
								</Link>
							</div>
						</>
					)}
			</main>
		</>
	)
}
