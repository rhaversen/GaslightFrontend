import { type Metadata } from 'next'

export async function generateMetadata ({ params }: Readonly<{
	children: React.ReactNode
	params: Promise<{ gameId: string }>
}>): Promise<Metadata> {
	const resolvedParams = await params
	return {
		title: {
			template: '%s | Gaslight',
			default: 'Game'
		},
		alternates: {
			canonical: `https://www.gaslight.fun/games/${resolvedParams.gameId}`
		}
	}
}

export default function GameLayout ({
	children
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ gameId: string }>
}>): React.JSX.Element {
	return (
		<>
			{children}
		</>
	)
}
