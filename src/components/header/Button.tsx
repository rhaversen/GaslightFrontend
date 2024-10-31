'use client'

import { useRouter } from 'next/navigation'
import React, { type ReactElement } from 'react'

const Button = ({
	title,
	path
}: {
	title: string
	path: string
}): ReactElement => {
	const router = useRouter()
	function handleRedirect (): void {
		router.push(path)
	}

	return (
		<button className="border-2 m-3 rounded-full border-white transition duration-300 hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-110"
			onClick={handleRedirect}
			type='button'
		>
			<div className='font-semibold p-5'>
				{title}
			</div>
		</button>
	)
}

export default Button
