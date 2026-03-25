'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-xl font-extrabold text-gray-700 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all"
      >
        Try Again
      </button>
    </div>
  )
}
