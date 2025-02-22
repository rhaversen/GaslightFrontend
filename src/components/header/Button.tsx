'use client'

import Link from 'next/link'
import React, { type ReactElement } from 'react'

interface ButtonProps {
	title: string
	path?: string
	onClick?: () => void
}

const Button = ({ title, path = '/', onClick }: ButtonProps): ReactElement<any> => {
	if (onClick != null) {
		return (
			<button
				onClick={onClick}
				className="border-2 m-1 sm:m-2 rounded-2xl md:rounded-full border-white transition duration-300 hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-110"
				type='button'
			>
				<div className='font-semibold p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base whitespace-nowrap'>
					{title}
				</div>
			</button>
		)
	}

	return (
		<Link href={path} className="border-2 m-1 sm:m-2 rounded-2xl md:rounded-full border-white transition duration-300 hover:shadow-[0_0_100px_rgba(255,255,255,100)] hover:bg-white hover:text-black hover:scale-110">
			<div className='font-semibold p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base whitespace-nowrap'>
				{title}
			</div>
		</Link>
	)
}

export default Button
