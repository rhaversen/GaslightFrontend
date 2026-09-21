import { useRouter } from 'next/navigation'

import { authApi } from '@/api'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useUser } from '@/contexts/UserProvider'

export const useLogout = (): { logout: () => void } => {
	const router = useRouter()
	const { addError } = useError()
	const { refetchUser } = useUser()

	const logout = (): void => {
		authApi.logout()
			.then(() => refetchUser())
			.then(() => { router.push('/') })
			.catch(addError)
	}

	return { logout }
}
