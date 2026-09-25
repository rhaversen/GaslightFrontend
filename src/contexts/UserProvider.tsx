'use client'
import { useQuery } from '@tanstack/react-query'
import React, { createContext, type ReactNode, type ReactElement, useContext } from 'react'

import { authApi } from '@/api'
import { type UserType } from '@/types/backendDataTypes'

interface UserContextType {
	currentUser: UserType | null
	isLoading: boolean
	error: Error | null
	refetchUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
	currentUser: null,
	isLoading: false,
	error: null,
	refetchUser: async () => { }
})

export const useUser = (): UserContextType => useContext(UserContext)

// The auth endpoint 401s for guests — that is the "not logged in" state, not
// an error, so it resolves to null.
const fetchUser = async (): Promise<UserType | null> => {
	try {
		return await authApi.me()
	} catch {
		return null
	}
}

export default function UserProvider ({ children }: { readonly children: ReactNode }): ReactElement {
	// Update useQuery generic types to allow null result.
	const { data: currentUser, isLoading, error, refetch } = useQuery<UserType | null, Error, UserType | null, string[]>({
		queryKey: ['user'],
		queryFn: fetchUser,
		retry: false,
		staleTime: 5 * 60 * 1000 // Consider data stale after 5 minutes
	})

	const value = React.useMemo(() => ({
		currentUser: currentUser ?? null,
		isLoading,
		error: error as Error | null,
		refetchUser: async () => {
			await refetch()
		}
	}), [currentUser, isLoading, error, refetch])

	return (
		<UserContext.Provider value={value}>
			{children}
		</UserContext.Provider>
	)
}
