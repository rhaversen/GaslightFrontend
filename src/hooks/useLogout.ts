import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export const useLogout = (): { logout: () => void } => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()
	const { refetchUser } = useUser()

	const logout = (): void => {
		axios.post(`${API_URL}/v1/auth/logout-local`, {}, { withCredentials: true })
			.then(() => refetchUser())
			.then(() => router.push('/'))
			.catch(addError)
	}

	return { logout }
}
