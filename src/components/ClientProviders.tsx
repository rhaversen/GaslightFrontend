import ErrorProvider from '@/contexts/ErrorContext/ErrorProvider'
import UserProvider from '@/contexts/UserProvider'
import { type ReactNode } from 'react'

export default function ClientProviders({ children }: { children: ReactNode }) {

	return (
		<ErrorProvider>
			<UserProvider>
				{children}
			</UserProvider>
		</ErrorProvider>
	)
}
