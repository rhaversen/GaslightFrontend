import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Modify Strategy'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun/user/[userId]/strategies/[strategy]'
	}
}

export default function StrategyLayout ({
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
