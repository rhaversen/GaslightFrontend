'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { type ReactNode } from 'react'

import ErrorProvider from '@/contexts/ErrorContext/ErrorProvider'
import UserProvider from '@/contexts/UserProvider'

export default function ClientProviders ({ children }: { children: ReactNode }) {
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
