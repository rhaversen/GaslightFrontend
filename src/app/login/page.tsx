'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, type ReactElement, useEffect, useState } from 'react'

import { authApi } from '@/api'
import { useUser } from '@/contexts/UserProvider'

// Unified auth page in the Facture AuthForm style: centered single card,
// login/register tabs, token-scale styling. Already-authenticated visitors
// are bounced to the app.

const inputClass = 'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent'
const labelClass = 'block text-xs font-medium text-muted'

function tabClass (active: boolean): string {
	return `px-3 py-1 rounded-lg ${active ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground'}`
}

export default function Page (): ReactElement {
	return (
		<Suspense fallback={<div className="min-h-screen" />}>
			<AuthPage />
		</Suspense>
	)
}

function AuthPage (): ReactElement {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { refetchUser } = useUser()
	const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	// Already signed in — nothing to do here.
	useEffect(() => {
		authApi.me()
			.then(() => { router.replace('/') })
			.catch(() => { /* guest is fine */ })
	}, [router])

	const submit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault()
		setError(null)
		if (mode === 'register' && password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		setBusy(true)
		try {
			if (mode === 'login') {
				await authApi.login({ email, password })
			} else {
				await authApi.signup({ email, password, confirmPassword })
			}
			await refetchUser()
			router.replace('/')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Authentication failed')
			setBusy(false)
		}
	}

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<form onSubmit={(e) => { void submit(e) }} className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 space-y-4">
				<div className="space-y-1">
					<h1 className="text-lg font-medium text-foreground">{'Gaslight'}</h1>
					<p className="text-sm text-muted">
						{mode === 'login' ? 'Log in to your account' : 'Create your account'}
					</p>
				</div>

				<div className="flex gap-1 text-sm">
					<button type="button" onClick={() => { setMode('login'); setError(null) }} className={tabClass(mode === 'login')}>{'Log in'}</button>
					<button type="button" onClick={() => { setMode('register'); setError(null) }} className={tabClass(mode === 'register')}>{'Register'}</button>
				</div>

				<div className="space-y-1">
					<label htmlFor="auth-email" className={labelClass}>{'Email'}</label>
					<input
						id="auth-email"
						type="email"
						value={email}
						onChange={(e) => { setEmail(e.target.value) }}
						autoComplete="username"
						required
						className={inputClass}
					/>
				</div>

				<div className="space-y-1">
					<label htmlFor="auth-password" className={labelClass}>{'Password'}</label>
					<input
						id="auth-password"
						type="password"
						value={password}
						onChange={(e) => { setPassword(e.target.value) }}
						autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
						minLength={4}
						required
						className={inputClass}
					/>
				</div>

				{mode === 'register' && (
					<div className="space-y-1">
						<label htmlFor="auth-confirm" className={labelClass}>{'Confirm password'}</label>
						<input
							id="auth-confirm"
							type="password"
							value={confirmPassword}
							onChange={(e) => { setConfirmPassword(e.target.value) }}
							autoComplete="new-password"
							minLength={4}
							required
							className={inputClass}
						/>
					</div>
				)}

				{error !== null && <p className="text-sm text-danger">{error}</p>}

				<button
					type="submit"
					disabled={busy}
					className="w-full bg-accent text-accent-contrast rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
				>
					{busy ? '…' : mode === 'login' ? 'Log in' : 'Register'}
				</button>

				<p className="text-center text-xs text-subtle">
					{mode === 'login' ? 'New to Gaslight? ' : 'Already have an account? '}
					<button
						type="button"
						className="text-muted hover:text-foreground underline underline-offset-2"
						onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
					>
						{mode === 'login' ? 'Register' : 'Log in'}
					</button>
				</p>
			</form>
		</main>
	)
}
