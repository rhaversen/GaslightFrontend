import { type ReactElement } from 'react'

const LoadingPlaceholder = ({ variant = 'light' }: { variant?: 'light' | 'dark' }): ReactElement<any> => {
	const bgColors = {
		light: 'bg-gray-200',
		dark: 'bg-gray-700'
	}
	
	const containerBg = {
		light: 'bg-gray-50',
		dark: 'bg-gray-800'
	}

	return (
		<div className="animate-pulse space-y-4 w-full">
			<div className={`h-6 ${bgColors[variant]} rounded-lg w-1/3 mx-auto`}></div>
			<div className={`space-y-2 ${containerBg[variant]} p-4 rounded-xl`}>
				<div className={`h-3 ${bgColors[variant]} rounded w-3/4`}></div>
				<div className={`h-3 ${bgColors[variant]} rounded w-2/3`}></div>
				<div className={`h-3 ${bgColors[variant]} rounded w-1/2`}></div>
			</div>
		</div>
	)
}

export default LoadingPlaceholder
