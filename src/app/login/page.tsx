'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Try sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!signInError) {
        router.push('/discover')
        router.refresh()
        return
      }

      // If user doesn't exist or email not confirmed, sign up fresh
      if (signInError.message === 'Invalid login credentials' || signInError.message === 'Email not confirmed') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        // If session returned, we're good (email confirmation disabled)
        if (data.session) {
          router.push('/discover')
          router.refresh()
          return
        }

        // If no session, try signing in (some Supabase configs auto-confirm)
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (!retryError) {
          router.push('/discover')
          router.refresh()
          return
        }

        throw new Error('Account created but email confirmation is required. Please disable "Confirm email" in your Supabase dashboard under Authentication > Providers > Email.')
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
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-violet-600 px-4 py-4 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : 'Continue'}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400">
            New users are automatically signed up.
          </p>
        </div>

        <div className="text-center mt-8">
          <a href="/disclaimer" className="text-white/40 text-xs font-medium hover:text-white/60 transition-colors">Safety & Disclaimer</a>
        </div>
      </div>
    </div>
  )
}
