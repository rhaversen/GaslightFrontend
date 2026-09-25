'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useRef, type ReactElement } from 'react'

import { tournamentsApi, usersApi } from '@/api'
import Header from '@/components/header/Header'
import { useUser } from '@/contexts/UserProvider'
import type { TournamentCycleStatus, UserType } from '@/types/backendDataTypes'

import { HaloCalm, HaloAggressive } from '../components/VantaBackground'

type TimeObject = {
	hours: string
	minutes: string
	seconds: string
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

const TimerSection = ({ tournamentInProgress }: { tournamentInProgress: boolean }): ReactElement => {
	const [now, setNow] = useState<Date | null>(null)

	// Ticking clock: single interval, both displays derive from `now`. Starts
	// null so the server and client render the same placeholder (no hydration
	// mismatch from time-dependent output).
	useEffect(() => {
		setNow(new Date())
		const interval = setInterval(() => {
			setNow(new Date())
		}, 1000)
		return () => { clearInterval(interval) }
	}, [])

	// Daily tournaments fire at UTC midnight, regardless of the viewer's
	// timezone — so both the countdown target and the elapsed display are
	// derived from the UTC day boundary, not the local one.
	const nextUtcMidnight = (date: Date): Date => {
		const next = new Date(date)
		next.setUTCHours(24, 0, 0, 0)
		return next
	}

	const currentUtcMidnight = (date: Date): Date => {
		const current = new Date(date)
		current.setUTCHours(0, 0, 0, 0)
		return current
	}

	const splitDuration = (milliseconds: number): TimeObject => {
		const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
		return {
			hours: String(Math.floor(totalSeconds / 3600)).padStart(2, '0'),
			minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
			seconds: String(totalSeconds % 60).padStart(2, '0')
		}
	}

	const time = now === null
		? { hours: '--', minutes: '--', seconds: '--' }
		: tournamentInProgress
			? splitDuration(now.getTime() - currentUtcMidnight(now).getTime())
			: splitDuration(nextUtcMidnight(now).getTime() - now.getTime())

	return (
		<>
			<TimerDisplay
				time={time}
				label={tournamentInProgress ? 'TOURNAMENT IN PROGRESS' : 'NEXT TOURNAMENT'}
			/>
			<div className='text-white/60 text-sm font-light tracking-wide'>
				{tournamentInProgress ? 'since 00:00 UTC' : 'until 00:00 UTC'}
			</div>
		</>
	)
}

export default function Page (): ReactElement {
	const router = useRouter()
	const { currentUser } = useUser()
	const userDataPromiseRef = useRef<Promise<UserType | null> | null>(null)
	const [cycleStatus, setCycleStatus] = useState<TournamentCycleStatus | null>(null)
	const tournamentInProgress = cycleStatus?.tournamentInProgress ?? false

	// The daily cycle fires at UTC midnight; the backend derives the running
	// flag from whether a tournament exists for the current UTC day. Poll
	// lightly so the flag flips shortly after midnight (and after the batch
	// completes) without any manual refresh.
	useEffect(() => {
		let cancelled = false
		const fetchStatus = (): void => {
			tournamentsApi.status()
				.then(status => {
					if (!cancelled) { setCycleStatus(status) }
				})
				.catch((err: unknown) => {
					console.error('Failed to fetch tournament status:', err)
				})
		}
		fetchStatus()
		const interval = setInterval(fetchStatus, 30_000)
		return () => {
			cancelled = true
			clearInterval(interval)
		}
	}, [])

	const handleAmbiguousClick = async (): Promise<void> => {
		// If user is not logged in, redirect to signup page
		if (currentUser == null) {
			router.push('/signup')
			return
		}

		try {
			let userData: UserType | null = null
			if (userDataPromiseRef.current != null) {
				userData = await userDataPromiseRef.current
			} else if (currentUser._id !== '') {
				userData = await usersApi.get(currentUser._id)
			}

			if (userData == null) {
				throw new Error('No user data available')
			}

			if (userData.submissionCount > 0) {
				router.push(`/explore?focus=user/${currentUser._id}`)
			} else {
				router.push('/strategies/new')
			}
		} catch (error) {
			console.error('Failed to fetch user data:', error)
		}
	}

	const tournamentButton = (
		<button
			className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 px-10 py-4 rounded-xl
                text-white text-xl font-medium tracking-wide transform transition-all duration-300
                hover:scale-105 hover:shadow-[0_0_50px_rgba(167,139,250,1)]
                active:scale-95"
			onClick={() => { void handleAmbiguousClick() }}
			type='button'
		>
			{'JOIN TOURNAMENT'}
		</button>
	)

	const resultsLink = (
		<Link
			href={cycleStatus?.latestTournamentId != null
				? `/tournaments/${cycleStatus.latestTournamentId}`
				: '/tournaments'}
			className="border-2 m-1 sm:m-2 rounded-2xl md:rounded-full border-white transition duration-300
                hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-110"
		>
			<div className='font-semibold p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base whitespace-nowrap'>
				{tournamentInProgress ? 'WATCH CURRENT TOURNAMENT' : 'SHOW LAST TOURNAMENT RESULTS'}
			</div>
		</Link>
	)

	return (
		<>
			<div className="fixed inset-0">
				{tournamentInProgress ? <HaloAggressive /> : <HaloCalm />}
			</div>
			<div className="relative">
				<main className="flex flex-col h-screen overflow-hidden items-center">
					<Header />
					<div className="text-center flex flex-col items-center gap-8 flex-grow justify-center">
						<TimerSection tournamentInProgress={tournamentInProgress} />
						{tournamentButton}
						{resultsLink}
					</div>
				</main>
			</div>
		</>
	)
}
