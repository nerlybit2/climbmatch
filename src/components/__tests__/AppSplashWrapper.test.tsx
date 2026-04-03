import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('@/contexts/ProfileContext',  () => ({ useProfile:  vi.fn() }))
vi.mock('@/contexts/DiscoverContext', () => ({ useDiscover: vi.fn() }))
vi.mock('@/contexts/InboxContext',    () => ({ useInbox:    vi.fn() }))
vi.mock('@/contexts/MyPostsContext',  () => ({ useMyPosts:  vi.fn() }))
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string; [k: string]: unknown }) => <img alt={alt} {...props} />,
}))
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
    expect(screen.getByAltText('ClimbMatch')).toBeTruthy()
  })

  it('shows the splash when multiple contexts are loading', () => {
    setLoading(true, true, true, true)
    render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)
    expect(screen.getByAltText('ClimbMatch')).toBeTruthy()
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
    expect(screen.queryByAltText('ClimbMatch')).toBeNull()
    vi.useRealTimers()
  })

  it('does not call SplashScreen.hide while still loading', () => {
    setLoading(false, false, true, false) // inbox still loading
    render(<AppSplashWrapper><div>App</div></AppSplashWrapper>)
    expect(SplashScreen.hide).not.toHaveBeenCalled()
  })
})
