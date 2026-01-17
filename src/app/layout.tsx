import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { type ReactElement } from 'react'

import ClientProviders from '@/components/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	metadataBase: new URL('https://www.gaslight.fun'),
	title: {
		template: '%s | Gaslight',
		default: 'Gaslight'
	},
	description: 'Write your strategies, compete in daily tournaments, and see your code ranked at Gaslight!',
	keywords: [
		'code-based gaming',
		'strategy games',
		'daily competitions',
		'coding tournaments',
		'multiplayer development',
		'interactive programming',
		'create your own games',
		'Gaslight'
	],
	openGraph: {
		siteName: 'Gaslight: Code-based Strategy Tournaments',
		type: 'website',
		locale: 'en_US'
	},
	robots: {
		index: true,
		follow: true,
		'max-image-preview': 'large',
		'max-snippet': -1,
		'max-video-preview': -1,
		googleBot: 'index, follow'
	},
	alternates: {
		canonical: 'https://www.gaslight.fun'
	},
	applicationName: 'Gaslight',
	appleWebApp: {
		title: 'Gaslight',
		statusBarStyle: 'default',
		capable: true
	},
	icons: {
		icon: '/favicon.ico'
	}
}

export default function RootLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): ReactElement<any> {
	return (
		<html lang="en">
			<body className={inter.className}>
				<ClientProviders>
					{children}
				</ClientProviders>
			</body>
		</html>
	)
}
