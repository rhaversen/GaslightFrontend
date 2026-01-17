import { type Metadata } from 'next'

export async function generateMetadata ({ params }: Readonly<{
	children: React.ReactNode
	params: Promise<{ tournamentId: string }>
}>): Promise<Metadata> {
	const resolvedParams = await params
	return {
		title: {
			template: '%s | Gaslight',
			default: 'Viewing Tournament'
		},
		alternates: {
			canonical: `https://www.gaslight.fun/tournaments/${resolvedParams.tournamentId}`
		}
	}
}

export default function TournamentLayout ({
	children
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ tournamentId: string }>
}>): React.JSX.Element {
	return (
		<>
			{children}
		</>
	)
}
