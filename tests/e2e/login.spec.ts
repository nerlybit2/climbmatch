import { test, expect } from '@playwright/test'

// These tests run WITHOUT the saved session (unauthenticated)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows the login form', async ({ page }) => {
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
  })

  test('shows OAuth buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /apple/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /facebook/i })).toBeVisible()
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('alice@example.com')
    await page.getByPlaceholder(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText(/incorrect|invalid|wrong/i)).toBeVisible({ timeout: 8_000 })
  })

  test('forgot password link shows reset form', async ({ page }) => {
    await page.getByRole('button', { name: /forgot password/i }).click()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })

  test('redirects unauthenticated users away from /discover', async ({ page }) => {
    await page.goto('/discover')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
