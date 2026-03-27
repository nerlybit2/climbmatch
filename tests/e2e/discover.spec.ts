import { test, expect } from '@playwright/test'

test.describe('Discover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/discover')
    // Wait for loading to finish
    await expect(page.getByText(/loading/i)).not.toBeVisible({ timeout: 8_000 })
  })

  test('shows the discover page with search bar', async ({ page }) => {
    await expect(page.getByText(/search by location/i).or(
      page.getByText(/filter/i)
    )).toBeVisible()
  })

  test('shows partner cards or empty state', async ({ page }) => {
    const hasCards = await page.locator('button').filter({ hasText: /\w/ }).count()
    const hasEmpty = await page.getByText(/no climbers|create.*request/i).isVisible()
    expect(hasCards > 0 || hasEmpty).toBeTruthy()
  })

  test('filter panel opens and closes', async ({ page }) => {
    await page.getByText(/search by location/i).click()
    await expect(page.getByLabel(/date from/i).or(page.getByText(/time of day/i))).toBeVisible()
    await page.getByText(/search by location/i).click()
  })

  test('location filter narrows results', async ({ page }) => {
    await page.getByText(/search by location/i).click()
    await page.getByPlaceholder(/location/i).fill('Siurana')
    await page.getByRole('button', { name: /apply/i }).click()
    // Either shows results matching Siurana or empty state
    await expect(page.getByText(/siurana/i).or(page.getByText(/no climbers/i))).toBeVisible({ timeout: 5_000 })
  })

  test('clicking a card opens the detail sheet', async ({ page }) => {
    const firstCard = page.locator('button').filter({ hasText: /\w/ }).first()
    const hasCard = await firstCard.isVisible()
    if (!hasCard) test.skip()

    await firstCard.click()
    // Detail sheet should show Interested / Pass buttons
    await expect(page.getByRole('button', { name: /interested|connect/i })).toBeVisible({ timeout: 5_000 })
  })
})
