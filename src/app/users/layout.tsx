import UserAuthProvider from '@/contexts/UserAuthProvider'
import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Profile'
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
		<UserAuthProvider>
			{children}
		</UserAuthProvider>
	)
}