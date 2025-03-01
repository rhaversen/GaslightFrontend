import Header from '@/components/Header'
import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Games'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun/games'
	}
}

export default function GamesLayout ({
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
