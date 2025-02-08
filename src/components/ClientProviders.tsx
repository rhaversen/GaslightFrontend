'use client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorProvider from '@/contexts/ErrorContext/ErrorProvider'
import UserProvider from '@/contexts/UserProvider'
import { type ReactNode } from 'react'

export default function ClientProviders({ children }: { children: ReactNode }) {
	const [queryClient] = useState(() => new QueryClient())
	
	return (
		<QueryClientProvider client={queryClient}>
			<ErrorProvider>
				<UserProvider>
					{children}
				</UserProvider>
			</ErrorProvider>
		</QueryClientProvider>
	)
}
