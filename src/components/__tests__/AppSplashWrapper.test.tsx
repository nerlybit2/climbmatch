import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('@/contexts/ProfileContext',  () => ({ useProfile:  vi.fn() }))
vi.mock('@/contexts/DiscoverContext', () => ({ useDiscover: vi.fn() }))
vi.mock('@/contexts/InboxContext',    () => ({ useInbox:    vi.fn() }))
vi.mock('@/contexts/MyPostsContext',  () => ({ useMyPosts:  vi.fn() }))
vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: { hide: vi.fn().mockResolvedValue(undefined) },
}))

import { useProfile }  from '@/contexts/ProfileContext'
import { useDiscover } from '@/contexts/DiscoverContext'
import { useInbox }    from '@/contexts/InboxContext'
import { useMyPosts }  from '@/contexts/MyPostsContext'
import { AppSplashWrapper } from '@/components/AppSplashWrapper'
import { SplashScreen } from '@capacitor/splash-screen'

function setLoading(profile = false, discover = false, inbox = false, myPosts = false) {
  vi.mocked(useProfile).mockReturnValue({ loading: profile } as never)
  vi.mocked(useDiscover).mockReturnValue({ loading: discover } as never)
  vi.mocked(useInbox).mockReturnValue({ loading: inbox } as never)
  vi.mocked(useMyPosts).mockReturnValue({ loading: myPosts } as never)
}

describe('AppSplashWrapper', () => {
  beforeEach(() => vi.clearAllMocks())

  it('always renders children', () => {
    setLoading(false, false, false, false)
    render(<AppSplashWrapper><div>App content</div></AppSplashWrapper>)
    expect(screen.getByText('App content')).toBeTruthy()
  })

  it('shows the splash overlay while any context is loading', () => {
    setLoading(true, false, false, false)
    render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)
    expect(screen.getByText('ClimbMatch')).toBeTruthy()
  })

  it('shows the splash when multiple contexts are loading', () => {
    setLoading(true, true, true, true)
    render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)
    expect(screen.getByText('ClimbMatch')).toBeTruthy()
  })

  it('calls SplashScreen.hide when all contexts finish loading', async () => {
    vi.useFakeTimers()
    setLoading(false, false, false, false)
    render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)
    await act(async () => { await Promise.resolve() })
    expect(SplashScreen.hide).toHaveBeenCalledWith({ fadeOutDuration: 300 })
    vi.useRealTimers()
  })

  it('removes the overlay after the fade timeout', async () => {
    vi.useFakeTimers()
    setLoading(false, false, false, false)
    render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)
    await act(async () => { await Promise.resolve() })
    // Overlay is fading — still in DOM but opacity-0
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(screen.queryByText('ClimbMatch')).toBeNull()
    vi.useRealTimers()
  })

  it('does not call SplashScreen.hide while still loading', () => {
    setLoading(false, false, true, false) // inbox still loading
    render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)
    expect(SplashScreen.hide).not.toHaveBeenCalled()
  })

  describe('safety timeout — never blocks the UI forever', () => {
    it('force-hides after 8 seconds even when all contexts stay loading', async () => {
      // Regression test: if a context gets stuck in loading=true (e.g. network
      // error, dev server unreachable), the splash must still disappear so the
      // app is not permanently blocked.
      vi.useFakeTimers()
      setLoading(true, true, true, true) // all contexts stuck
      render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)

      // Before 8 seconds — still visible, no hide called
      await act(async () => { vi.advanceTimersByTime(7999) })
      expect(SplashScreen.hide).not.toHaveBeenCalled()
      expect(screen.getByText('ClimbMatch')).toBeTruthy()

      // At 8 seconds — force-hide triggers
      await act(async () => { vi.advanceTimersByTime(1) })
      expect(SplashScreen.hide).toHaveBeenCalledWith({ fadeOutDuration: 300 })

      // After fade animation (500ms) — overlay removed
      await act(async () => { vi.advanceTimersByTime(500) })
      expect(screen.queryByText('ClimbMatch')).toBeNull()

      vi.useRealTimers()
    })

    it('normal hide (contexts finish) cancels the safety timeout', async () => {
      // When loading finishes before the timeout, the safety timeout must be
      // cleared so SplashScreen.hide is only called once.
      vi.useFakeTimers()
      setLoading(false, false, false, false)
      render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)

      // Normal hide fires immediately
      await act(async () => { await Promise.resolve() })
      expect(SplashScreen.hide).toHaveBeenCalledTimes(1)

      // Fast-forward past the 8-second mark — no second call
      await act(async () => { vi.advanceTimersByTime(10000) })
      expect(SplashScreen.hide).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })
})
