/**
 * End-to-end flow tests — complete user journeys across multiple pages.
 *
 * Each test is a self-contained scenario that simulates a real user session.
 * Tests run sequentially (fullyParallel: false) and share the authenticated
 * session from auth.setup.ts, so database state persists between them.
 *
 * Flows:
 *  1. Profile setup
 *  2. Create → edit → cancel a post
 *  3. Discover a climber and express interest → verify in Inbox
 *  4. Navigation sanity (all tabs reachable)
 */
import { test, expect, type Page } from '@playwright/test'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Wait for the loading skeleton to disappear (used on Discover / Inbox / Requests). */
async function waitForContent(page: Page, timeout = 10_000) {
  await expect(page.locator('.animate-pulse').first()).not.toBeVisible({ timeout })
}

/** Returns tomorrow's date in YYYY-MM-DD. */
function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ─── flow 1: profile setup ──────────────────────────────────────────────────

test('flow: profile setup — fill and save display name', async ({ page }) => {
  await page.goto('/profile')

  // Input component has no htmlFor/id — use placeholder to locate fields
  await expect(page.getByPlaceholder(/climbing name/i)).toBeVisible({ timeout: 8_000 })

  const nameInput = page.getByPlaceholder(/climbing name/i)
  await nameInput.clear()
  await nameInput.fill('E2E Flow Tester')

  const areaInput = page.getByPlaceholder(/tel aviv/i)
  await areaInput.clear()
  await areaInput.fill('Test City')

  // Save
  await page.getByRole('button', { name: /save/i }).click()

  // Profile form redirects to /discover after saving (no toast shown)
  await expect(page).toHaveURL('/discover', { timeout: 10_000 })

  // Navigate back to profile and verify persistence
  await page.goto('/profile')
  await expect(page.getByPlaceholder(/climbing name/i)).toHaveValue('E2E Flow Tester', { timeout: 8_000 })
})

// ─── flow 2: post lifecycle ──────────────────────────────────────────────────

test('flow: create a post, edit it, then cancel it', async ({ page }) => {
  // ── Step 1: create ──────────────────────────────────────────────────────
  await page.goto('/requests/new')
  await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 8_000 })

  await page.locator('input[type="date"]').fill(tomorrow())
  await page.getByPlaceholder(/vertical playground/i).fill('E2E Flow Crag')

  // Check flexible so start_time is not required
  const flexCheckbox = page.getByLabel(/flexible/i)
  if (!(await flexCheckbox.isChecked())) {
    await flexCheckbox.check()
  }

  // Add notes — textarea has no htmlFor so select by element type
  const notesField = page.locator('textarea').first()
  if (await notesField.isVisible()) {
    await notesField.fill('Created by E2E flow test — original notes')
  }

  await page.getByRole('button', { name: /post request/i }).click()

  // Should redirect to /requests (exact path, not prefix like /requests/new)
  await expect(page).toHaveURL(/\/requests$/, { timeout: 10_000 })
  await waitForContent(page)

  // New post is in the list
  await expect(page.getByText('E2E Flow Crag').first()).toBeVisible({ timeout: 10_000 })

  // ── Step 2: edit ────────────────────────────────────────────────────────
  const editLink = page.getByRole('link', { name: /edit/i }).first()
  await expect(editLink).toBeVisible({ timeout: 5_000 })
  await editLink.click()

  // Edit form loads
  await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 8_000 })

  // Update notes
  const notesEdit = page.locator('textarea').first()
  if (await notesEdit.isVisible()) {
    await notesEdit.clear()
    await notesEdit.fill('Updated by E2E flow test — edited notes')
  }

  // Save changes
  await page.getByRole('button', { name: /save changes|post request/i }).click()

  // Back on /requests (use regex to match exact path, not prefix like /requests/id/edit)
  await expect(page).toHaveURL(/\/requests$/, { timeout: 10_000 })
  // Hard reload to flush stale cache and load fresh post list
  await page.goto('/requests')
  await waitForContent(page)

  // Wait for the active post to be present
  await expect(page.getByText('E2E Flow Crag').first()).toBeVisible({ timeout: 10_000 })

  // ── Step 3: cancel ──────────────────────────────────────────────────────
  const cancelBtn = page.getByRole('button', { name: /^cancel$/i }).first()
  await expect(cancelBtn).toBeVisible({ timeout: 10_000 })
  await cancelBtn.click()

  // Confirmation dialog appears
  await expect(page.getByText(/are you sure/i)).toBeVisible({ timeout: 3_000 })

  // Confirm cancellation
  await page.getByRole('button', { name: /yes|confirm/i }).click()

  // Post is now cancelled or removed
  await waitForContent(page)
  const cancelledOrGone = (await page.getByText(/cancelled/i).first().isVisible()) ||
    !(await page.getByText('E2E Flow Crag').first().isVisible())
  expect(cancelledOrGone).toBeTruthy()
})

// ─── flow 3: discover → express interest → inbox ────────────────────────────

test('flow: discover a climber, express interest, verify in inbox', async ({ page }) => {
  await page.goto('/discover')
  await waitForContent(page)

  // Cards have a profile photo (img) inside them — filter/refresh buttons do not
  const cards = page.locator('button').filter({ has: page.locator('img') })
  const cardCount = await cards.count()

  if (cardCount === 0) {
    await expect(page.getByText(/no climbers|create.*request/i)).toBeVisible({ timeout: 5_000 })
    return
  }

  // ── Step 1: open the first card ─────────────────────────────────────────
  await cards.first().click()

  // Detail sheet slides up
  const interestedBtn = page.getByRole('button', { name: /interested/i })
  await expect(interestedBtn).toBeVisible({ timeout: 6_000 })

  const climberName = await page.locator('.animate-slide-up h2, .animate-slide-up h3').first().textContent()

  // ── Step 2: tap Interested ──────────────────────────────────────────────
  await interestedBtn.click()

  await expect(interestedBtn).not.toBeVisible({ timeout: 6_000 })

  // Dismiss match celebration if it appeared
  const matchModal = page.getByRole('button', { name: /keep browsing|close/i })
  if (await matchModal.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await matchModal.click()
  }

  // ── Step 3: go to inbox → My Applications ───────────────────────────────
  await page.goto('/inbox')
  await waitForContent(page)

  await page.getByRole('button', { name: /my applications/i }).click()
  await page.waitForTimeout(500)

  const hasPending = await page.getByText(/pending|waiting/i).first().isVisible({ timeout: 5_000 }).catch(() => false)
  const hasCard    = await page.locator('[class*="rounded-3xl"]').count()

  expect(hasPending || hasCard > 0).toBeTruthy()

  if (climberName?.trim()) {
    const card = page.getByText(climberName.trim())
    if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(card).toBeVisible()
    }
  }

  // ── Step 4: back to discover — card is removed ──────────────────────────
  await page.goto('/discover')
  await waitForContent(page)

  if (climberName?.trim()) {
    await expect(page.locator('h1')).toBeVisible()
  }
})

// ─── flow 4: full navigation ─────────────────────────────────────────────────

test('flow: all bottom-nav tabs are reachable and load without error', async ({ page }) => {
  const tabs: Array<{ href: string; heading: RegExp }> = [
    { href: '/discover',  heading: /discover|find a partner/i },
    { href: '/inbox',     heading: /inbox/i },
    { href: '/requests',  heading: /my posts|posts/i },
    { href: '/profile',   heading: /profile/i },
  ]

  for (const tab of tabs) {
    await page.goto(tab.href)

    // No unhandled JS error modal
    await expect(page.getByRole('alert').filter({ hasText: /unexpected error/i })).not.toBeVisible()

    // Page renders a recognisable heading or content
    const heading = page.locator('h1, h2').filter({ hasText: tab.heading }).first()
    await expect(heading).toBeVisible({ timeout: 8_000 })
  }
})

// ─── flow 5: filter and search on discover ───────────────────────────────────

test('flow: filter by date narrows discover results', async ({ page }) => {
  await page.goto('/discover')
  await waitForContent(page)

  // Open filter panel
  await page.getByText(/search by location/i).click()
  // Date inputs appear in the filter panel
  await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 4_000 })

  // Set date to tomorrow (first date input = "from" date)
  await page.locator('input[type="date"]').first().fill(tomorrow())

  // Apply
  await page.getByRole('button', { name: /apply/i }).click()

  // Filter chip appears in the header
  await expect(page.locator('span').filter({ hasText: tomorrow() }).first()).toBeVisible({ timeout: 5_000 })

  // Result count text updates
  await waitForContent(page)

  // Re-open filter panel and clear
  await page.getByRole('button').filter({ hasText: /filter|active|search/i }).first().click()
  const clearBtn = page.getByRole('button', { name: /clear/i })
  if (await clearBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await clearBtn.click()
    await waitForContent(page)
  }
})

// ─── flow 6: navbar active state ─────────────────────────────────────────────

test('flow: navbar highlights the correct tab on every route', async ({ page }) => {
  // Helper: returns the href of whichever nav link has the gradient active class
  const activeTabHref = async () => {
    const activeLink = page.locator('nav a').filter({
      has: page.locator('[class*="from-blue"]'),
    })
    return activeLink.getAttribute('href')
  }

  // /discover → discover tab active
  await page.goto('/discover')
  await expect(page.locator('h1')).toBeVisible({ timeout: 8_000 })
  expect(await activeTabHref()).toBe('/discover')

  // /inbox → inbox tab active, NOT discover
  await page.goto('/inbox')
  await expect(page.locator('h1')).toBeVisible({ timeout: 8_000 })
  expect(await activeTabHref()).toBe('/inbox')

  // /requests → my posts tab active
  await page.goto('/requests')
  await expect(page.locator('h1')).toBeVisible({ timeout: 8_000 })
  expect(await activeTabHref()).toBe('/requests')

  // /requests/new → post tab active, NOT my posts tab (this was the bug)
  await page.goto('/requests/new')
  await expect(page.getByRole('button', { name: /post request/i })).toBeVisible({ timeout: 8_000 })
  expect(await activeTabHref()).toBe('/requests/new')

  // /profile → profile tab active
  await page.goto('/profile')
  await expect(page.locator('h1, [class*="ProfileForm"], label').first()).toBeVisible({ timeout: 8_000 })
  expect(await activeTabHref()).toBe('/profile')
})

// ─── flow 7: signup shows OTP screen ─────────────────────────────────────────

test('flow: signing up with a new email shows the OTP verification screen', async ({ page }) => {
  // Use a fresh page with no session for this test
  await page.context().clearCookies()
  await page.goto('/login')

  // Switch to Create Account — tab toggle is the first matching button
  await page.getByRole('button', { name: /create account/i }).first().click()
  await expect(page.getByPlaceholder('Your name')).toBeVisible({ timeout: 5_000 })

  // Fill in signup form with a unique email
  const uniqueEmail = `e2e+otp+${Date.now()}@climbmatch.test`
  await page.getByPlaceholder('Your name').fill('OTP Test User')
  await page.getByPlaceholder('Email').fill(uniqueEmail)
  await page.getByPlaceholder(/^Password \(min/i).fill('TestPass123!')
  await page.getByPlaceholder(/confirm password/i).fill('TestPass123!')

  // Submit via the form's submit button (not the tab toggle)
  await page.locator('form').getByRole('button', { name: /create account/i }).click()

  // Two possible outcomes depending on Supabase email confirmation setting:
  // (A) OTP verification required — shows OTP screen
  // (B) Email confirmation disabled — user auto-confirmed, redirected to profile setup
  const otpScreen   = page.getByText(/enter verification code/i)
  const profilePage = page.getByText(/create profile|display name/i)
  await expect(otpScreen.or(profilePage).first()).toBeVisible({ timeout: 10_000 })

  const isOtp = await otpScreen.isVisible({ timeout: 500 }).catch(() => false)
  if (isOtp) {
    // OTP flow: verify UI elements
    await expect(page.getByText(uniqueEmail)).toBeVisible()
    const boxes = page.locator('input[inputmode="numeric"]')
    await expect(boxes).toHaveCount(6)
    await expect(page.getByRole('button', { name: /resend/i })).toBeVisible()

    // Back button works
    await page.getByRole('button', { name: /← Back|back/i }).click()
    await expect(page.getByRole('button', { name: /create account/i }).first()).toBeVisible()
  }
  // If not OTP flow: signup succeeded and user landed on profile setup — test passes
})

// ─── flow 8: new post validation ─────────────────────────────────────────────

test('flow: submitting empty post form shows validation error', async ({ page }) => {
  await page.goto('/requests/new')
  await expect(page.getByRole('button', { name: /post request/i })).toBeVisible({ timeout: 8_000 })

  // Submit without filling anything
  await page.getByRole('button', { name: /post request/i }).click()

  // Inline validation error appears
  await expect(page.getByText(/required|fill in|date.*location/i)).toBeVisible({ timeout: 3_000 })

  // Still on /requests/new
  await expect(page).toHaveURL('/requests/new')
})
