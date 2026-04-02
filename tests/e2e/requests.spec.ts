import { test, expect } from '@playwright/test'

test.describe('My Posts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/requests')
    // Wait for the loading skeleton to disappear before each test
    await expect(page.locator('.animate-pulse').first()).not.toBeVisible({ timeout: 10_000 })
  })

  test('shows My Posts page', async ({ page }) => {
    await expect(page).toHaveURL('/requests')
    // Wait for content to load (skeleton disappears), then verify heading
    await expect(page.locator('.animate-pulse').first()).not.toBeVisible({ timeout: 10_000 })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5_000 })
  })

  test('can open new request form', async ({ page }) => {
    await page.goto('/requests/new')
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.getByPlaceholder(/vertical playground/i)).toBeVisible()
  })

  test('shows error when submitting empty form', async ({ page }) => {
    await page.goto('/requests/new')
    // Date is pre-filled with today; clear it so both required fields are empty
    await page.locator('input[type="date"]').fill('')
    await page.getByRole('button', { name: /post request/i }).click()
    // Browser HTML5 validation or JS validation prevents navigation
    await expect(page).toHaveURL('/requests/new')
  })

  test('creates a new request and shows it in My Posts', async ({ page }) => {
    await page.goto('/requests/new')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    await page.locator('input[type="date"]').fill(dateStr)
    await page.getByPlaceholder(/vertical playground/i).fill('Test Crag E2E')
    await page.getByLabel(/flexible/i).check()
    await page.getByRole('button', { name: /post request/i }).click()

    // Should redirect back to /requests and show the new post
    await expect(page).toHaveURL('/requests', { timeout: 8_000 })
    await expect(page.getByText('Test Crag E2E').first()).toBeVisible({ timeout: 10_000 })
  })

  test('edit button appears on active request', async ({ page }) => {
    // Assumes at least one active request exists (from the create test above or seed data)
    await expect(page.getByRole('link', { name: /edit/i }).first()).toBeVisible({ timeout: 5_000 })
  })

  test('cancel confirmation appears before cancelling', async ({ page }) => {
    const cancelBtn = page.getByRole('button', { name: /^cancel$/i }).first()
    await expect(cancelBtn).toBeVisible({ timeout: 5_000 })
    await cancelBtn.click()
    await expect(page.getByText(/are you sure/i)).toBeVisible()
    // Dismiss
    await page.getByRole('button', { name: /^no$/i }).click()
    await expect(page.getByText(/are you sure/i)).not.toBeVisible()
  })
})
