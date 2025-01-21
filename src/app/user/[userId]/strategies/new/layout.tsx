import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'New Strategy'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun/user/[userId]/strategies/new'
	}
}

export default function NewStrategyLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return (
		<>
			{children}
		</>
	)
}
