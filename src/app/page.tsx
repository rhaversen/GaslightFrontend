'use client'

import React, { useEffect, useState, type ReactElement } from 'react'
import { Halo } from '../components/VantaBackground'

export default function Page (): ReactElement {
	// Time generation function
	const timeToNextMidnight = (): string => {
		const now = new Date()
		const nextMidnight = new Date(now)
		nextMidnight.setHours(24, 0, 0, 0)
		const diff = nextMidnight.getTime() - now.getTime()
		const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0')
		const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0')
		return `${hours} : ${minutes}`
	}
	const [timeString, setTimeString] = useState(timeToNextMidnight())
	useEffect(() => {
		const interval = setInterval(() => {
			setTimeString(timeToNextMidnight())
		}, 1000)
		return () => { clearInterval(interval) }
	}, [])

	return (
		<main className="flex flex-col items-center justify-center h-screen">
			<Halo/>
			<div className='text-white font-semibold p-2'>
				{'NEXT RANKED TOURNAMENT'}
			</div>
			<div className='text-white text-6xl font-light p-2'>
				{timeString}
			</div>
			<button className="border-2 m-3 rounded-full border-white transition duration-300 hover:scale-110 hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black"
				onClick={() => { console.log('Joining tournament') }}
				type='button'
			>
				<div className='font-semibold p-5'>
					{'JOIN TOURNAMENT'}
				</div>
			</button>
		</main>
	)
}
