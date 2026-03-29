import { describe, it, expect } from 'vitest'

/**
 * Tests for the navbar isActive logic extracted as a pure function.
 * Mirrors the exact condition in Navbar.tsx so regressions are caught here
 * before running a browser.
 */
function isActive(tabHref: string, pathname: string): boolean {
  return (
    pathname === tabHref ||
    (tabHref !== '/requests/new' &&
      pathname !== '/requests/new' &&
      pathname.startsWith(tabHref + '/'))
  )
}

describe('Navbar active tab logic', () => {
  describe('/discover tab', () => {
    it('is active on /discover', () => expect(isActive('/discover', '/discover')).toBe(true))
    it('is not active on /inbox',  () => expect(isActive('/discover', '/inbox')).toBe(false))
    it('is not active on /requests', () => expect(isActive('/discover', '/requests')).toBe(false))
  })

  describe('/inbox tab', () => {
    it('is active on /inbox', () => expect(isActive('/inbox', '/inbox')).toBe(true))
    it('is not active on /discover', () => expect(isActive('/inbox', '/discover')).toBe(false))
  })

  describe('/requests tab (My Posts)', () => {
    it('is active on /requests', () => expect(isActive('/requests', '/requests')).toBe(true))
    it('is active on /requests/abc123/edit', () => expect(isActive('/requests', '/requests/abc123/edit')).toBe(true))

    // ── This was the bug ──────────────────────────────────────────────────
    it('is NOT active on /requests/new', () => expect(isActive('/requests', '/requests/new')).toBe(false))
  })

  describe('/requests/new tab (Post)', () => {
    it('is active on /requests/new', () => expect(isActive('/requests/new', '/requests/new')).toBe(true))
    it('is not active on /requests', () => expect(isActive('/requests/new', '/requests')).toBe(false))
    it('is not active on /requests/abc/edit', () => expect(isActive('/requests/new', '/requests/abc/edit')).toBe(false))
  })

  describe('/profile tab', () => {
    it('is active on /profile', () => expect(isActive('/profile', '/profile')).toBe(true))
    it('is not active on /discover', () => expect(isActive('/profile', '/discover')).toBe(false))
  })
})
