/**
 * Playwright global setup — runs once before any browser is launched.
 * Creates (or resets) the E2E test user via the Supabase Admin API so
 * the account is confirmed and ready to log in.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit this key).
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually (Playwright doesn't auto-load it in globalSetup)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) process.env[match[1].trim()] = match[2].trim()
    }
  } catch {
    // .env.local not found — rely on process.env being set externally
  }
}

async function globalSetup() {
  loadEnv()

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const email          = process.env.TEST_USER_EMAIL    ?? 'e2e@climbmatch.test'
  const password       = process.env.TEST_USER_PASSWORD ?? 'E2eTest!2024'

  if (!supabaseUrl) {
    console.warn('[e2e setup] NEXT_PUBLIC_SUPABASE_URL not set — skipping test user creation')
    return
  }
  if (!serviceRoleKey) {
    console.warn('[e2e setup] SUPABASE_SERVICE_ROLE_KEY not set — skipping test user creation.')
    console.warn('            Add it to .env.local to auto-create the test user, or create')
    console.warn(`            "${email}" manually in the Supabase dashboard with password "${password}".`)
    return
  }

  const adminBase = `${supabaseUrl}/auth/v1/admin/users`
  const headers = {
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  }

  // 1. Check if user already exists
  const listRes = await fetch(`${adminBase}?email=${encodeURIComponent(email)}`, { headers })
  const listJson = await listRes.json() as { users?: Array<{ id: string }> }
  const existing = listJson.users?.[0]

  if (existing) {
    // Update password (idempotent run) and ensure email is confirmed
    await fetch(`${adminBase}/${existing.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password, email_confirm: true }),
    })
    console.log(`[e2e setup] Test user "${email}" already exists — password updated.`)
    return
  }

  // 2. Create new confirmed user
  const createRes = await fetch(adminBase, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`[e2e setup] Failed to create test user: ${err}`)
  }
  console.log(`[e2e setup] Test user "${email}" created successfully.`)
}

export default globalSetup
