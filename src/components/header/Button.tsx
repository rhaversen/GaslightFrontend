'use client'

import Link from 'next/link'
import React, { type ReactElement } from 'react'

interface ButtonProps {
	title: string
	path?: string
	onClick?: () => void
}

const buttonClass = 'px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors whitespace-nowrap'

const Button = ({ title, path = '/', onClick }: ButtonProps): ReactElement => {
	if (onClick != null) {
		return (
			<button onClick={onClick} className={buttonClass} type='button'>
				{title}
			</button>
		)
	}

	return (
		<Link href={path} className={buttonClass}>
			{title}
		</Link>
	)
}

export default Button
