import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Profile'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun/user/[userId]'
	}
}

export default function ProfileLayout ({
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
