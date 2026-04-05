import Link from 'next/link'

export default function PublicDisclaimerPage() {
  return (
    <div className="min-h-[100dvh] bg-stone-50 px-5 py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold tracking-tight mb-6">Safety & Disclaimer</h1>
        <div className="space-y-4">
          <div className="bg-[#f0f7f5] rounded-2xl p-5">
            <h3 className="text-[#0a5048] font-extrabold mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span> Safety First
            </h3>
            <ul className="space-y-2 text-sm text-[#0a5048]/70 font-medium">
              <li className="flex gap-2"><span>•</span>Always verify your partner&apos;s experience before climbing together.</li>
              <li className="flex gap-2"><span>•</span>Meet in public places for the first time.</li>
              <li className="flex gap-2"><span>•</span>Share your plans with a trusted contact.</li>
              <li className="flex gap-2"><span>•</span>Check gear and certifications in person.</li>
              <li className="flex gap-2"><span>•</span>Trust your instincts — if something feels off, leave.</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-5 card-shadow">
            <h3 className="font-extrabold mb-3">Disclaimer</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              ClimbMatch is a platform to connect climbers. We do not verify users&apos; identities,
              experience levels, or qualifications. Climbing is inherently dangerous. You assume
              all risk when meeting and climbing with partners found through this app.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              ClimbMatch is not responsible for any injuries, accidents, damages, or losses that
              occur as a result of connections made through this platform.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/login" className="text-[#0a5048] text-sm font-bold hover:text-[#0b3c35] transition-colors">&larr; Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
