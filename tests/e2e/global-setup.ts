/**
 * Playwright global setup — runs once before any browser is launched.
 * 1. Ensures both test users exist with working credentials.
 * 2. Upserts complete profiles so the middleware profile-gate doesn't redirect.
 *
 * Strategy: verify sign-in first. Only delete+recreate if credentials fail.
 * Uses find() to match by email — the ?email= filter on the admin API is unreliable.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit this key).
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  } catch { /* rely on process.env */ }
}

async function trySignIn(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<{ access_token: string; user: { id: string } } | null> {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) return null
  return res.json()
}

async function ensureUser(
  adminBase: string,
  adminHeaders: Record<string, string>,
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<string> {
  // Fast path: credentials already work
  const session = await trySignIn(supabaseUrl, anonKey, email, password)
  if (session) {
    console.log(`[e2e setup] "${email}" credentials OK.`)
    return session.user.id
  }

  // Find and delete existing user (use find() — the ?email= filter is unreliable)
  const listRes = await fetch(`${adminBase}?per_page=200`, { headers: adminHeaders })
  const listJson = await listRes.json() as { users?: Array<{ id: string; email: string }> }
  const existing = listJson.users?.find(u => u.email === email)
  if (existing) {
    const delRes = await fetch(`${adminBase}/${existing.id}`, { method: 'DELETE', headers: adminHeaders })
    if (!delRes.ok) throw new Error(`[e2e setup] Failed to delete "${email}": ${await delRes.text()}`)
    await new Promise(r => setTimeout(r, 2_000))
  }

  // Create fresh
  const createRes = await fetch(adminBase, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  if (!createRes.ok) throw new Error(`[e2e setup] Failed to create "${email}": ${await createRes.text()}`)
  const newUser = await createRes.json() as { id: string }

  // Verify credentials work
  await new Promise(r => setTimeout(r, 2_000))
  const verify = await trySignIn(supabaseUrl, anonKey, email, password)
  if (!verify) throw new Error(`[e2e setup] "${email}" created but sign-in still fails.`)

  console.log(`[e2e setup] "${email}" created and verified.`)
  return newUser.id
}

async function ensureProfile(
  restBase: string,
  serviceHeaders: Record<string, string>,
  userId: string,
  displayName: string,
) {
  // Reuse a public placeholder photo that already exists in this project's storage
  const photoUrl = 'https://xnexfrldlbbsptolhsnx.supabase.co/storage/v1/object/public/avatars/73581d39-e3d0-4242-8a80-258bce259cae/avatar-1774778394805.png'
  const res = await fetch(`${restBase}/profiles`, {
    method: 'POST',
    headers: {
      ...serviceHeaders,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id:           userId,
      display_name: displayName,
      photo_url:    photoUrl,
      phone:        '+15550000001',
    }),
  })
  if (!res.ok) {
    console.warn(`[e2e setup] Profile upsert warning for ${userId}: ${await res.text()}`)
  } else {
    console.log(`[e2e setup] Profile ready for "${displayName}" (${userId})`)
  }
}

async function globalSetup() {
  loadEnv()

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const emailA         = process.env.TEST_USER_EMAIL     ?? 'e2e-a@climbmatch.test'
  const passwordA      = process.env.TEST_USER_PASSWORD  ?? 'E2eTest!2024'
  const emailB         = process.env.TEST_USER2_EMAIL    ?? 'e2e2@climbmatch.test'
  const passwordB      = process.env.TEST_USER2_PASSWORD ?? 'E2eTest!2024'

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.warn('[e2e setup] Missing env vars — skipping user setup')
    return
  }

  const adminBase    = `${supabaseUrl}/auth/v1/admin/users`
  const restBase     = `${supabaseUrl}/rest/v1`
  const adminHeaders = {
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  }

  const idA = await ensureUser(adminBase, adminHeaders, supabaseUrl, anonKey, emailA, passwordA)
  const idB = await ensureUser(adminBase, adminHeaders, supabaseUrl, anonKey, emailB, passwordB)

  await ensureProfile(restBase, adminHeaders, idA, 'E2E Poster')
  await ensureProfile(restBase, adminHeaders, idB, 'E2E Applicant')

  // Cancel all active partner requests for both test users to avoid hitting the 10-post limit
  for (const userId of [idA, idB]) {
    const res = await fetch(
      `${restBase}/partner_requests?user_id=eq.${userId}&status=eq.active`,
      {
        method: 'PATCH',
        headers: { ...adminHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'cancelled' }),
      }
    )
    if (!res.ok) {
      console.warn(`[e2e setup] Could not cancel requests for ${userId}: ${await res.text()}`)
    } else {
      console.log(`[e2e setup] Cancelled active requests for user ${userId}`)
    }
  }

  console.log('[e2e setup] All users ready.')
}

export default globalSetup
