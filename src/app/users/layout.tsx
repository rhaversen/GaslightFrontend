import { type Metadata } from 'next'

import Header from '@/components/Header'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Users'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun/users'
	}
}

export default function UserLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return (
		<>
			<Header/>
			{children}
		</>
	)
}
