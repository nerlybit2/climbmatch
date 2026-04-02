import { test, expect } from '@playwright/test'

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile')
  })

  test('shows profile form', async ({ page }) => {
    await expect(page.getByPlaceholder(/climbing name/i)).toBeVisible({ timeout: 5_000 })
  })

  test('shows phone input with country selector', async ({ page }) => {
    // Country code dropdown button should be present
    await expect(page.getByRole('button').filter({ hasText: /\+\d+/ })).toBeVisible({ timeout: 5_000 })
  })

  test('shows instagram and facebook fields', async ({ page }) => {
    await expect(page.getByPlaceholder(/@your_username/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByPlaceholder(/facebook\.com/i)).toBeVisible({ timeout: 5_000 })
  })

  test('can update display name', async ({ page }) => {
    const nameInput = page.getByPlaceholder(/climbing name/i)
    await nameInput.fill('E2E Test User')
    await page.getByRole('button', { name: /save/i }).click()
    // Profile form redirects to /discover after saving (no toast)
    await expect(page).toHaveURL('/discover', { timeout: 10_000 })
  })
})
