import { test, expect } from '@playwright/test'

// These tests run WITHOUT the saved session (unauthenticated)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible({ timeout: 8_000 })
  })

  // ── Sign In tab ──────────────────────────────────────────────────────────

  test('shows Sign In tab by default with email, password, OAuth buttons', async ({ page }) => {
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /facebook/i })).toBeVisible()
  })

  test('does not show Apple button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /apple/i })).not.toBeVisible()
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('nobody@climbmatch.test')
    await page.getByPlaceholder('Password').fill('wrongpassword')
    await page.locator('form').getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/incorrect|invalid|wrong/i)).toBeVisible({ timeout: 8_000 })
  })

  test('forgot password link shows reset form', async ({ page }) => {
    await page.getByRole('button', { name: /forgot password/i }).click()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
    await expect(page.getByText(/reset your password/i)).toBeVisible()
  })

  test('reset form back button returns to sign in', async ({ page }) => {
    await page.getByRole('button', { name: /forgot password/i }).click()
    await page.getByRole('button', { name: /back to sign in/i }).click()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
  })

  // ── Create Account tab ───────────────────────────────────────────────────

  test('switching to Create Account tab shows name and confirm password fields', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).first().click()
    await expect(page.getByPlaceholder('Your name')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder(/confirm password/i)).toBeVisible()
  })

  test('signup validation: empty name shows error', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).first().click()
    await page.getByPlaceholder('Email').fill('test@example.com')
    await page.getByPlaceholder(/^Password/i).first().fill('password123')
    await page.getByPlaceholder(/confirm password/i).fill('password123')
    // Leave name empty
    await page.locator('form').getByRole('button', { name: /create account/i }).click()
    // Browser HTML5 validation fires (native tooltip) — page stays at /login
    await expect(page).toHaveURL('/login')
    await expect(page.getByPlaceholder('Your name')).toBeVisible()
  })

  test('signup validation: mismatched passwords shows error', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).first().click()
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByPlaceholder('Email').fill('test@example.com')
    await page.getByPlaceholder(/^Password/i).first().fill('password123')
    await page.getByPlaceholder(/confirm password/i).fill('different456')
    await page.locator('form').getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/do not match/i)).toBeVisible({ timeout: 3_000 })
  })

  test('switching tabs clears error message', async ({ page }) => {
    // Trigger an error on sign in
    await page.getByPlaceholder('Email').fill('nobody@climbmatch.test')
    await page.getByPlaceholder('Password').fill('wrongpassword')
    await page.locator('form').getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/incorrect|invalid/i)).toBeVisible({ timeout: 8_000 })

    // Switch to Create Account — error should clear
    await page.getByRole('button', { name: /create account/i }).first().click()
    await expect(page.getByText(/incorrect|invalid/i)).not.toBeVisible()
  })

  // ── Auth guard ───────────────────────────────────────────────────────────

  test('redirects unauthenticated users away from /discover', async ({ page }) => {
    await page.goto('/discover')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test('redirects unauthenticated users away from /inbox', async ({ page }) => {
    await page.goto('/inbox')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
