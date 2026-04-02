/**
 * Runs once before all flow tests that need a second authenticated user.
 * Signs in as User B via the Supabase REST API and injects the session cookie
 * directly — bypasses the login UI entirely.
 */
import { test as setup, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import path from 'path'

export const AUTH_FILE_2 = path.join(__dirname, '.auth/user2.json')

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) env[m[1].trim()] = m[2].trim()
    }
  } catch { /* rely on process.env */ }
  return { ...process.env as Record<string, string>, ...env }
}

const EMAIL    = process.env.TEST_USER2_EMAIL    ?? 'e2e2@climbmatch.test'
const PASSWORD = process.env.TEST_USER2_PASSWORD ?? 'E2eTest!2024'

setup('authenticate user2', async ({ page }) => {
  const env         = loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey     = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!supabaseUrl || !anonKey) throw new Error('[auth setup2] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`[auth setup2] Sign-in API failed for ${EMAIL}: ${await res.text()}`)

  const session = await res.json()
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

  await page.context().addCookies([
    {
      name:     `sb-${projectRef}-auth-token`,
      value:    `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`,
      domain:   'localhost',
      path:     '/',
      expires:  Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
      httpOnly: false,
      secure:   false,
      sameSite: 'Lax',
    },
    { name: 'pc', value: '1', domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' },
  ])

  await page.goto('/discover')
  await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 })

  await page.context().storageState({ path: AUTH_FILE_2 })
})
