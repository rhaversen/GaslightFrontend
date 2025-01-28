import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Sign Up'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun/tournaments'
	}
}

export default function TournamentsLayout ({
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
