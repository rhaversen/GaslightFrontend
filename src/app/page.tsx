'use client'

import React, { useEffect, useState, useRef, type ReactElement } from 'react'
import { HaloCalm, HaloAgressive } from '../components/VantaBackground'
import Header from '@/components/header/Header'
import { useUser } from '@/contexts/UserProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import type { UserType } from '@/types/backendDataTypes'

type TimeObject = {
	hours: string
	minutes: string
	seconds: string
}

const TimerSection = ({ tournamentInProgress }: { tournamentInProgress: boolean }): ReactElement => {
	const [timeToTournament, setTimeToTournament] = useState<TimeObject>({ hours: '--', minutes: '--', seconds: '--' })
	const [timeSinceTournament, setTimeSinceTournament] = useState<TimeObject>({ hours: '--', minutes: '--', seconds: '--' })

	const timeToNextMidnight = (): TimeObject => {
		const now = new Date()
		const nextMidnight = new Date(now)
		nextMidnight.setHours(24, 0, 0, 0)
		const diff = nextMidnight.getTime() - now.getTime()
		return {
			hours: String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0'),
			minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
			seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0')
		}
	}

	const timeSinceMidnight = (): TimeObject => {
		const now = new Date()
		const midnight = new Date(now)
		midnight.setHours(0, 0, 0, 0) // Set to previous midnight
		const diff = now.getTime() - midnight.getTime()
		return {
			hours: String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0'),
			minutes: String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
			seconds: String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0')
		}
	}

	const TimerDisplay = ({ time, label }: { time: TimeObject, label: string }): ReactElement => (
		<>
			<div className='text-white text-xl font-medium tracking-wide'>
				{label}
			</div>
			<div className='flex justify-center items-center gap-2'>
				<div className='text-white text-4xl md:text-7xl font-light tracking-wider w-[2ch]'>
					{time.hours}
				</div>
				<div className='text-white text-4xl md:text-7xl font-light tracking-wider'>{':'}</div>
				<div className='text-white text-4xl md:text-7xl font-light tracking-wider w-[2ch]'>
					{time.minutes}
				</div>
				<div className='text-white text-4xl md:text-7xl font-light tracking-wider'>{':'}</div>
				<div className='text-white text-4xl md:text-7xl font-light tracking-wider w-[2ch]'>
					{time.seconds}
				</div>
			</div>
		</>
	)

	useEffect(() => {
		setTimeToTournament(timeToNextMidnight())
		const interval = setInterval(() => {
			setTimeToTournament(timeToNextMidnight())
		}, 1000)
		return () => { clearInterval(interval) }
	}, [])

	useEffect(() => {
		setTimeSinceTournament(timeSinceMidnight())
		const interval = setInterval(() => {
			setTimeSinceTournament(timeSinceMidnight())
		}, 1000)
		return () => { clearInterval(interval) }
	}, [])

	return (
		<TimerDisplay
			time={tournamentInProgress ? timeSinceTournament : timeToTournament}
			label={tournamentInProgress ? 'TOURNAMENT IN PROGRESS' : 'NEXT TOURNAMENT'}
		/>
	)
}

export default function Page(): ReactElement<any> {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
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
				router.push('/strategies/new')
			}
		} catch (error) {
			console.error('Failed to fetch user data:', error)
		}
	}

	const TournamentButton = (): ReactElement => (
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
	)

	const ResultsLink = (): ReactElement => (
		<Link
			href="/tournaments"
			className="border-2 m-1 sm:m-2 rounded-2xl md:rounded-full border-white transition duration-300 
                hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-110"
		>
			<div className='font-semibold p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base whitespace-nowrap'>
				{'SHOW LAST TOURNAMENT RESULTS\r'}
			</div>
		</Link>
	)

	return (
		<div className="h-screen">
			<Header />
			<main className="flex flex-col h-full items-center justify-center relative overflow-hidden">
				{tournamentInProgress
					? <HaloAgressive />
					: <HaloCalm />
				}
				<div className="z-10 text-center flex flex-col items-center gap-8">
					<TimerSection tournamentInProgress={tournamentInProgress} />
					<TournamentButton />
					<ResultsLink />
				</div>
			</main>
		</div>
	)
}
