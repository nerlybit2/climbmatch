'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        })
        if (resetError) throw resetError
        setResetSent(true)
        setLoading(false)
        return
      }

      // Try sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (!signInError) {
        window.location.href = '/discover'
        return
      }

      if (signInError.message === 'Invalid login credentials' || signInError.message === 'Email not confirmed') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) {
          if (signUpError.code === 'user_already_exists') throw new Error('Incorrect email or password. Please try again.')
          throw signUpError
        }

        if (data.session) {
          window.location.href = '/discover'
          return
        }

        const { error: retryError } = await supabase.auth.signInWithPassword({ email, password })
        if (!retryError) {
          window.location.href = '/discover'
          return
        }

        throw new Error('Incorrect email or password. Please try again.')
      }

      throw signInError
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-rose-500 to-violet-600" />
      <div className="absolute top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-24 -right-16 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-8 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/20">
            <span className="text-5xl">🧗</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">ClimbMatch</h1>
          <p className="text-white/60 mt-2 text-lg font-medium">Find your climbing partner</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-5">
          {mode === 'reset' ? (
            resetSent ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-bold text-gray-800">Check your email</p>
                <p className="text-sm text-gray-500">We sent a password reset link to <strong>{email}</strong></p>
                <button onClick={() => { setMode('login'); setResetSent(false) }} className="text-sm font-semibold text-rose-500 hover:text-rose-600">
                  Back to login
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-bold text-gray-800 mb-1">Reset your password</p>
                  <p className="text-sm text-gray-400">Enter your email and we'll send you a reset link.</p>
                </div>
                {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-violet-600 px-4 py-4 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </form>
                <button onClick={() => { setMode('login'); setError('') }} className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600">
                  Back to login
                </button>
              </>
            )
          ) : (
            <>
              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
                <div className="space-y-1">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                  <div className="text-right">
                    <button type="button" onClick={() => { setMode('reset'); setError('') }} className="text-xs font-semibold text-rose-500 hover:text-rose-600">
                      Forgot password?
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-violet-600 px-4 py-4 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : 'Continue'}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('facebook')}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white hover:bg-[#166fe5] active:scale-[0.98] transition-all shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>

              <p className="text-xs text-center text-gray-400">
                New users are automatically signed up.
              </p>
            </>
          )}
        </div>

        <div className="text-center mt-8">
          <a href="/disclaimer" className="text-white/40 text-xs font-medium hover:text-white/60 transition-colors">Safety & Disclaimer</a>
        </div>
      </div>
    </div>
  )
}
