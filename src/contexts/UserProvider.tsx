'use client'
import { type UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, {
	createContext,
	type Dispatch,
	ReactElement,
	type ReactNode,
	type SetStateAction,
	useContext,
	useEffect,
	useState
} from 'react'

interface UserContextType {
	currentUser: UserType | null
	setCurrentUser: Dispatch<SetStateAction<UserType | null>>
}

const UserContext = createContext<UserContextType>({
	currentUser: null,
	setCurrentUser: () => { }
})

export const useUser = (): UserContextType => useContext(UserContext)

export default function UserProvider ({ children }: { readonly children: ReactNode }): ReactElement<any> {
	const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
		if (typeof window !== 'undefined') {
			const storedUser = localStorage.getItem('currentUser')
			return (storedUser !== null) ? JSON.parse(storedUser) : null
		}
		return null
	})

	const fetchUserData = async (): Promise<void> => {
		try {
			const { data } = await axios.get<UserType>('/api/v1/users/me', {
				withCredentials: true
			})
			setCurrentUser(data)
		} catch (error) {
			console.error('Failed to fetch user data:', error)
			setCurrentUser(null)
		}
	}

	useEffect(() => {
		void fetchUserData()
	}, [])

	useEffect(() => {
		if (currentUser !== null) {
			localStorage.setItem('currentUser', JSON.stringify(currentUser))
		} else {
			localStorage.removeItem('currentUser')
		}
	}, [currentUser])

	const value = React.useMemo(() => ({
		currentUser,
		setCurrentUser
	}), [currentUser, setCurrentUser])

	return (
		<UserContext.Provider value={value}>
			{children}
		</UserContext.Provider>
	)
}
