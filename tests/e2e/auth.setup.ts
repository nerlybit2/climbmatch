/**
 * Runs once before all flow tests.
 * Logs in as the test user and saves the browser session so every test
 * starts already authenticated — no repeated login UI.
 *
 * The test user is auto-created by global-setup.ts if SUPABASE_SERVICE_ROLE_KEY
 * is set in .env.local. Otherwise create "e2e@climbmatch.test" manually in the
 * Supabase dashboard with password "E2eTest!2024".
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

export const AUTH_FILE = path.join(__dirname, '.auth/user.json')
const EMAIL    = process.env.TEST_USER_EMAIL    ?? 'e2e@climbmatch.test'
const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'E2eTest!2024'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 10_000 })

  await page.getByPlaceholder('Email').fill(EMAIL)
  await page.getByPlaceholder(/password/i).fill(PASSWORD)
  await page.getByRole('button', { name: /continue/i }).click()

  // Login does window.location.href = '/discover' — wait for navigation away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 })

  // Save session for all other tests
  await page.context().storageState({ path: AUTH_FILE })
})
