'use client'

import React, { useEffect, useState, type ReactElement } from 'react'
import { Halo } from '../components/VantaBackground'
import Header from '@/components/header/Header'

export default function Page (): ReactElement {
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

	const [timeString, setTimeString] = useState('-- : -- : --')

	useEffect(() => {
		setTimeString(timeToNextMidnight())
		const interval = setInterval(() => {
			setTimeString(timeToNextMidnight())
		}, 1000)
		return () => { clearInterval(interval) }
	}, [])

	return (
		<>
			<Header />
			<main className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
				<Halo />
				<div className="z-10 text-center space-y-8">
					<div className='text-white text-xl font-medium tracking-wide'>
						{'NEXT RANKED TOURNAMENT IN\r'}
					</div>
					<div className='text-white text-7xl font-light tracking-wider'>
						{timeString}
					</div>
					<button
						className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 px-10 py-4 rounded-xl
								text-white text-xl font-medium tracking-wide transform transition-all duration-300
								hover:scale-105 hover:shadow-[0_0_50px_rgba(167,139,250,1)]
								active:scale-95"
						onClick={() => { console.log('Joining tournament') }}
						type='button'
					>
						{'JOIN TOURNAMENT\r'}
					</button>
				</div>
			</main>
		</>
	)
}
