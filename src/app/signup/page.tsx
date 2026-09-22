import { redirect } from 'next/navigation'
import type { ReactElement } from 'react'

// Signup is a mode of the unified auth page, not its own screen.
export default function SignupPage (): ReactElement {
	redirect('/login?mode=register')
}
