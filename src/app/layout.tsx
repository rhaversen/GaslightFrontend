import ErrorProvider from '@/contexts/ErrorContext/ErrorProvider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { type ReactElement } from 'react'
import Header from '@/components/header/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: {
		template: '%s | Gaslight',
		default: 'Gaslight'
	},
	description: 'Gaslight',
	alternates: {
		canonical: 'https://www.gaslight.fun'
	},
	icons: {
		icon: '/favicon.ico'
	}
}

export default function RootLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): ReactElement {
	return (
		<html lang="en">
			<body className={inter.className}>
				<ErrorProvider>
					<Header />
					{children}
				</ErrorProvider>
			</body>
		</html>
	)
}
