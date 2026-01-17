import { type Metadata } from 'next'

export async function generateMetadata ({ params }: Readonly<{
	children: React.ReactNode
	params: Promise<{ userId: string }>
}>): Promise<Metadata> {
	const resolvedParams = await params
	return {
		title: {
			template: '%s | Gaslight',
			default: 'Strategies'
		},
		alternates: {
			canonical: `https://www.gaslight.fun/users/${resolvedParams.userId}/strategies`
		}
	}
}

export default function StrategiesLayout ({
	children
}: Readonly<{
	children: React.ReactNode
	params: Promise<{ userId: string }>
}>): React.JSX.Element {
	return (
		<>
			{children}
		</>
	)
}
