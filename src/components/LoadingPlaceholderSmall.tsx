import { type ReactElement } from 'react'

const LoadingPlaceholder = ({ variant = 'light' }: { variant?: 'light' | 'dark' }): ReactElement<any> => {
	const bgColor = variant === 'light' ? 'bg-gray-200' : 'bg-gray-700'
	return (
		<div className={`animate-pulse inline-block h-2 ${bgColor} rounded w-12`} />
	)
}

export default LoadingPlaceholder
