import { test, expect } from '@playwright/test'

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile')
  })

  test('shows profile form', async ({ page }) => {
    await expect(page.getByLabel(/display name/i)).toBeVisible({ timeout: 5_000 })
  })

  test('shows phone input with country selector', async ({ page }) => {
    // Country code dropdown button should be present
    await expect(page.getByRole('button').filter({ hasText: /\+\d+/ })).toBeVisible({ timeout: 5_000 })
  })

  test('shows instagram and facebook fields', async ({ page }) => {
    await expect(page.getByLabel(/instagram/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel(/facebook/i)).toBeVisible({ timeout: 5_000 })
  })

  test('can update display name', async ({ page }) => {
    const nameInput = page.getByLabel(/display name/i)
    await nameInput.fill('E2E Test User')
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/saved|updated/i)).toBeVisible({ timeout: 5_000 })
  })
})
