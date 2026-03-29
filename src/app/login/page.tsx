'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

type Mode = 'signin' | 'signup' | 'reset'

// ─── OTP input — 6 boxes, auto-advance, paste support ────────────────────────
function OtpInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled: boolean }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const update = useCallback((index: number, value: string) => {
    // Handle paste of full code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      const next = ['', '', '', '', '', ''].map((_, i) => pasted[i] ?? '')
      setDigits(next)
      const focusIdx = Math.min(pasted.length, 5)
      refs.current[focusIdx]?.focus()
      if (pasted.length === 6) onComplete(pasted.join(''))
      return
    }

    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    if (digit && index < 5) refs.current[index + 1]?.focus()
    if (next.every(d => d !== '')) onComplete(next.join(''))
  }, [digits, onComplete])

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          disabled={disabled}
          onChange={e => update(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          className={`w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all outline-none
            ${digit ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50 text-gray-800'}
            focus:border-indigo-500 focus:bg-white disabled:opacity-40`}
        />
      ))}
    </div>
  )
}

// ─── Password input ───────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, show, onToggle }: {
  value: string; onChange: (v: string) => void; placeholder: string
  show: boolean; onToggle: () => void
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required minLength={6}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />
      <button type="button" onClick={onToggle} tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
        {show ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')

  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [showPassword, setShowPassword]     = useState(false)
  const [displayName, setDisplayName]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirm, setShowConfirm]       = useState(false)

  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [resetSent, setResetSent]           = useState(false)
  const [awaitingOtp, setAwaitingOtp]       = useState(false)
  const [otpLoading, setOtpLoading]         = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // ── Deep link handler (native only) ────────────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const handleDeepLink = async (url: string) => {
      if (!url.startsWith('climbmatch://auth/callback')) return
      let code: string | null = null
      try { code = new URL(url).searchParams.get('code') } catch { setError('OAuth error: malformed URL'); return }
      if (!code) { setError('OAuth error: missing code'); return }
      setLoading(true)
      const supabase = createClient()
      const { error: err } = await supabase.auth.exchangeCodeForSession(code)
      if (err) { setError(`OAuth error: ${err.message}`); setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('OAuth error: no user'); setLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
      router.replace(profile ? '/discover' : '/profile')
    }
    App.getLaunchUrl().then(r => { if (r?.url) handleDeepLink(r.url) })
    const listener = App.addListener('appUrlOpen', ({ url }) => handleDeepLink(url))
    return () => { listener.then(l => l.remove()) }
  }, [router])

  const switchMode = (next: Mode) => {
    setMode(next); setError(''); setResetSent(false); setAwaitingOtp(false)
  }

  // ── OTP verify ─────────────────────────────────────────────────────────
  const handleOtpComplete = async (code: string) => {
    setOtpLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      })
      if (verifyError) { setError('Incorrect code. Try again.'); setOtpLoading(false); return }

      // Upsert profile with display name if signing up
      if (data.user && displayName.trim()) {
        await supabase.from('profiles').upsert({ id: data.user.id, display_name: displayName.trim() })
      }
      window.location.href = '/profile'
    } catch {
      setError('Something went wrong. Please try again.')
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError('')
    const { error: err } = await createClient().auth.resend({ type: 'signup', email })
    if (err) { setError(err.message); return }
    setResendCooldown(30)
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    const redirectTo = Capacitor.isNativePlatform()
      ? 'climbmatch://auth/callback'
      : `${window.location.origin}/auth/callback`
    await createClient().auth.signInWithOAuth({ provider, options: { redirectTo } })
  }

  // ── Sign In ─────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { error: err } = await createClient().auth.signInWithPassword({ email, password })
      if (!err) { window.location.href = '/discover'; return }
      if (err.message === 'Email not confirmed') {
        await createClient().auth.resend({ type: 'signup', email })
        setAwaitingOtp(true); setResendCooldown(30); setLoading(false); return
      }
      throw new Error('Invalid email or password.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // ── Sign Up ─────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) { setError('Please enter your name.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        if (err.message.includes('already registered')) throw new Error('An account with this email already exists. Try signing in.')
        throw err
      }
      if (data.session) { window.location.href = '/discover'; return }
      setAwaitingOtp(true)
      setResendCooldown(30)
      setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // ── Reset password ──────────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const origin = window.location.origin.includes('localhost') ? 'https://climbmatch.vercel.app' : window.location.origin
      const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      })
      if (err) throw err
      setResetSent(true); setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700" />
      <div className="absolute top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-24 -right-16 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl border border-white/20">
            <span className="text-4xl">🧗</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">ClimbMatch</h1>
          <p className="text-white/60 mt-1.5 text-base font-medium">Find your climbing partner</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-5">

          {/* ── OTP verification screen ── */}
          {awaitingOtp ? (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="font-bold text-gray-900 text-lg">Enter verification code</p>
                <p className="text-sm text-gray-500 mt-1">We sent a 6-digit code to</p>
                <p className="text-sm font-semibold text-gray-800">{email}</p>
              </div>

              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

              <OtpInput onComplete={handleOtpComplete} disabled={otpLoading} />

              {otpLoading && (
                <p className="text-center text-sm text-indigo-500 font-medium animate-pulse">Verifying…</p>
              )}

              <div className="text-center space-y-2">
                <p className="text-xs text-gray-400">Didn't get it? Check spam or</p>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-sm font-semibold text-indigo-500 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <button onClick={() => { setAwaitingOtp(false); setError('') }}
                className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                ← Back
              </button>
            </div>

          /* ── Reset password ── */
          ) : mode === 'reset' ? (
            resetSent ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-bold text-gray-800">Reset link sent</p>
                <p className="text-sm text-gray-500">Check your inbox at <strong>{email}</strong></p>
                <button onClick={() => switchMode('signin')} className="text-sm font-semibold text-indigo-500 hover:text-indigo-700">
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-bold text-gray-800 mb-0.5">Reset your password</p>
                  <p className="text-sm text-gray-400">We'll send a reset link to your email.</p>
                </div>
                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                <form onSubmit={handleReset} className="space-y-3">
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  <button type="submit" disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
                <button onClick={() => switchMode('signin')} className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600">
                  Back to sign in
                </button>
              </>
            )

          /* ── Sign In / Sign Up ── */
          ) : (
            <>
              {/* Tab toggle */}
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button onClick={() => switchMode('signin')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                  Sign In
                </button>
                <button onClick={() => switchMode('signup')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                  Create Account
                </button>
              </div>

              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

              {/* Sign In */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  <div className="space-y-1">
                    <PasswordInput value={password} onChange={setPassword} placeholder="Password"
                      show={showPassword} onToggle={() => setShowPassword(p => !p)} />
                    <div className="text-right">
                      <button type="button" onClick={() => switchMode('reset')}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Sign Up */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  <PasswordInput value={password} onChange={setPassword} placeholder="Password (min 6 chars)"
                    show={showPassword} onToggle={() => setShowPassword(p => !p)} />
                  <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password"
                    show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />
                  <p className="text-xs text-gray-400">You'll complete your climbing profile after signing up.</p>
                  <button type="submit" disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>
              )}

              {/* OAuth */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button type="button" onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button type="button" onClick={() => handleOAuth('facebook')}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white hover:bg-[#166fe5] active:scale-[0.98] transition-all shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/disclaimer" className="text-white/40 text-xs font-medium hover:text-white/60 transition-colors">Safety & Disclaimer</a>
        </div>
      </div>
    </div>
  )
}
