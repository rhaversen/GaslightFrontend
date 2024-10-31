import React, { type ReactElement } from 'react'
import Button from './Button'

const Header = (): ReactElement => {
	const buttons: Record<string, string> = {
		Profile: '/',
		'Overall Ranking': '/about',
		'Last Tournament': '/contact'
	}

	return (
		<div className='p-5 absolute'>
			{Object.entries(buttons).map(([title, path]) => (
				<Button key={title} title={title} path={path} />
			))}
		</div>
	)
}

export default Header
