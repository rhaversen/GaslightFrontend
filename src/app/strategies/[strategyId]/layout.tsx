import { type Metadata } from 'next'

export async function generateMetadata ({ params }: Readonly<{
	children: React.ReactNode
	params: Promise<{ strategyId: string }>
}>): Promise<Metadata> {
	const resolvedParams = await params
	return {
		title: {
			template: '%s | Gaslight',
			default: 'Modify Strategy'
		},
		alternates: {
			canonical: `https://www.gaslight.fun/strategies/${resolvedParams.strategyId}`
		}
	}
}

export default function StrategyLayout ({
	children
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ strategyId: string }>
}>): React.JSX.Element {
	return (
		<>
			{children}
		</>
	)
}
