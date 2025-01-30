import { type Metadata } from 'next'

export async function generateMetadata({ params }: Readonly<{
	children: React.ReactNode
	params: Promise<{ userId: string }>
}>): Promise<Metadata> {
	const resolvedParams = await params
	return {
		title: {
			template: '%s | Gaslight',
			default: 'Profile'
		},
		alternates: {
			canonical: `https://www.gaslight.fun/users/${resolvedParams.userId}`
		}
	}
}

export default function ProfileLayout({
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
