import { type ReactElement } from 'react'

const LoadingPlaceholder = (): ReactElement<any> => {
	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto max-w-4xl p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-10 bg-gray-200 rounded-lg w-1/3 mx-auto"></div>
					<div className="space-y-4 bg-gray-50 p-6 rounded-xl">
						<div className="h-4 bg-gray-200 rounded w-3/4"></div>
						<div className="h-4 bg-gray-200 rounded w-2/3"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					</div>
				</div>
			</div>
		</main>
	)
}

export default LoadingPlaceholder
