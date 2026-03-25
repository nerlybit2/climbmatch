'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => { window.location.href = '/discover' }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-rose-500 to-violet-600" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/20">
            <span className="text-5xl">🧗</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">ClimbMatch</h1>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-5">
          {done ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-gray-800">Password updated!</p>
              <p className="text-sm text-gray-400">Redirecting you in...</p>
            </div>
          ) : (
            <>
              <div>
                <p className="font-bold text-gray-800 mb-1">Set new password</p>
                <p className="text-sm text-gray-400">Choose a strong password for your account.</p>
              </div>
              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-violet-600 px-4 py-4 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
