import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — ClimbMatch',
  description: 'Privacy policy for the ClimbMatch app.',
}

const LAST_UPDATED = 'March 29, 2025'
const CONTACT_EMAIL = 'privacy@climbmatch.app'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#EDF1F7] px-5 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to ClimbMatch
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-slate-400 mt-1">Last updated: {LAST_UPDATED}</p>
          </div>

          <section className="space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              ClimbMatch (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This policy explains what data we collect, how we use it, and your rights regarding your data.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <p>We collect the following information when you create an account and use the app:</p>
            <ul>
              <li><strong>Account information:</strong> email address, display name, and profile photo.</li>
              <li><strong>Contact information:</strong> phone number, Instagram handle, and Facebook username — used only to connect you with matched climbing partners.</li>
              <li><strong>Climbing profile:</strong> home area, climbing grades, gear, and bio.</li>
              <li><strong>Climbing requests:</strong> date, location, and notes for posts you create.</li>
              <li><strong>App interactions:</strong> interests you express and matches you make.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul>
              <li>To match you with compatible climbing partners based on your requests and interests.</li>
              <li>To show your profile to other climbers when they view your post.</li>
              <li>To send real-time notifications when someone shows interest in your request.</li>
              <li>To allow matched partners to contact you directly (via WhatsApp, SMS, or social media).</li>
              <li>To improve the app and fix bugs.</li>
            </ul>
          </Section>

          <Section title="3. Information Sharing">
            <p>
              We do not sell your personal data. Your contact details (phone, Instagram, Facebook) are
              only revealed to another user after a mutual match — both parties must express interest
              before contact information is shared.
            </p>
            <p>
              We use <strong>Supabase</strong> for database and authentication services. Data is stored
              on Supabase infrastructure hosted in the EU (AWS eu-central-1). Supabase&apos;s privacy policy
              applies to data processed through their platform.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p>
              Your data is retained for as long as your account is active. You may delete your account
              at any time from the Profile page in the app. Upon deletion, your profile, posts, and
              interaction history are permanently removed within 30 days.
            </p>
          </Section>

          <Section title="5. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data (right to be forgotten).</li>
              <li>Object to or restrict certain processing.</li>
              <li>Export your data in a portable format.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-500 font-medium">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="6. Security">
            <p>
              All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text.
              We follow industry-standard security practices to protect your information.
            </p>
          </Section>

          <Section title="7. Children">
            <p>
              ClimbMatch is not directed at children under 13. We do not knowingly collect data from
              children. If you believe a child has provided us with personal information, please contact
              us and we will delete it.
            </p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>
              We may update this policy from time to time. We will notify you of significant changes
              by posting the new policy in the app. Continued use of the app after changes constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="9. Contact Us">
            <p>
              If you have any questions about this privacy policy or your data, contact us at:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-500 font-medium">{CONTACT_EMAIL}</a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  )
}
