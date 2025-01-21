import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Strategies'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun/user/[userId]/strategies'
	}
}

export default function UserLayout ({
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
