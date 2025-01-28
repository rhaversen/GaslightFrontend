import { type ReactElement } from 'react'

const LoadingPlaceholder = (): ReactElement<any> => {
	return (
		<main className="animate-pulse inline-block">
			<div className="h-2 bg-gray-500 rounded w-12"></div>
		</main>
	)
}

export default LoadingPlaceholder
