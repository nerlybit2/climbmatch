import { test, expect } from '@playwright/test'

test.describe('Inbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inbox')
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 8_000 })
  })

  test('shows inbox with two tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /applicants/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /my applications/i })).toBeVisible()
  })

  test('can switch between tabs', async ({ page }) => {
    await page.getByRole('button', { name: /my applications/i }).click()
    // Tab should become active (gradient style applied)
    const tab = page.getByRole('button', { name: /my applications/i })
    await expect(tab).toHaveClass(/from-blue|gradient/, { timeout: 3_000 })
  })

  test('shows cards or empty state in applicants tab', async ({ page }) => {
    const hasCards = await page.locator('[class*="rounded-3xl"]').count()
    const hasEmpty = await page.getByText(/no.*applicants|discover/i).isVisible()
    expect(hasCards > 0 || hasEmpty).toBeTruthy()
  })

  test('shows cards or empty state in applications tab', async ({ page }) => {
    await page.getByRole('button', { name: /my applications/i }).click()
    const hasCards = await page.locator('[class*="rounded-3xl"]').count()
    const hasEmpty = await page.getByText(/no.*applications|start swiping/i).isVisible()
    expect(hasCards > 0 || hasEmpty).toBeTruthy()
  })

  test('accept/decline buttons visible on pending applicant card', async ({ page }) => {
    const pendingCard = page.locator('[class*="rounded-3xl"]').filter({
      has: page.getByText(/pending/i),
    }).first()

    const hasPending = await pendingCard.isVisible()
    if (!hasPending) test.skip()

    await expect(pendingCard.getByRole('button', { name: /accept/i })).toBeVisible()
    await expect(pendingCard.getByRole('button', { name: /decline/i })).toBeVisible()
  })

  test('contact buttons visible on accepted card', async ({ page }) => {
    const acceptedCard = page.locator('[class*="rounded-3xl"]').filter({
      has: page.getByText(/accepted/i),
    }).first()

    const hasAccepted = await acceptedCard.isVisible()
    if (!hasAccepted) test.skip()

    // Should show WhatsApp or SMS or social button
    await expect(
      acceptedCard.getByRole('link', { name: /whatsapp|sms|instagram|facebook/i })
    ).toBeVisible()
  })
})
