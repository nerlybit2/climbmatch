/**
 * Scroll behaviour tests.
 *
 * 1. usePullToRefresh hook — touch event logic, threshold, refresh callback.
 *    The hook attaches listeners via useEffect. We must call rerender() after
 *    assigning containerRef.current so the effect re-runs and picks up the element.
 *
 * 2. Scroll container class contract — structural source-code assertions that
 *    enforce the CSS height chain required for scrolling to work:
 *
 *    Outer shell:  h-[100dvh] overflow-hidden  → definite viewport height
 *    <main>:       flex-1 overflow-hidden pb-28 → constrained; pb-28 reserves navbar clearance
 *    Wrapper div:  flex-1 min-h-0 overflow-y-auto → fills parent and scrolls content
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()
function readSrc(rel: string) {
  return readFileSync(resolve(ROOT, 'src', rel), 'utf8')
}

// ─── helpers ────────────────────────────────────────────────────────────────

function touch(clientY: number): Partial<TouchEvent> {
  return { touches: [{ clientY } as Touch], preventDefault: vi.fn() }
}

function makeDiv(): HTMLDivElement {
  const el = document.createElement('div')
  Object.defineProperty(el, 'scrollTop', { value: 0, writable: true })
  document.body.appendChild(el)
  return el
}

type HookDiv = React.MutableRefObject<HTMLDivElement>

/**
 * Attach div to the hook's containerRef and force the effect to re-run.
 *
 * The hook's effect dep array does NOT include `containerRef.current` (refs are
 * intentionally stable). To force the effect to re-run after the ref is set we
 * pass a new `onRefresh` wrapper on rerender — this changes the `handleRefresh`
 * useCallback, which IS in the dep array, triggering the effect cleanup + re-attach.
 */
function attachDiv(
  result: { current: ReturnType<typeof usePullToRefresh> },
  rerender: (props: { fn: () => Promise<void>; threshold: number }) => void,
  div: HTMLDivElement,
  onRefresh: () => Promise<void>,
  threshold: number
) {
  ;(result.current.containerRef as HookDiv).current = div
  // New function reference → handleRefresh changes → effect re-runs → listeners attach
  rerender({ fn: () => onRefresh(), threshold })
}

// ─── usePullToRefresh ────────────────────────────────────────────────────────

describe('usePullToRefresh', () => {
  let div: HTMLDivElement
  beforeEach(() => { div = makeDiv() })
  afterEach(() => { div.remove(); vi.clearAllMocks() })

  it('initialises with pullProgress=0 and isRefreshing=false', () => {
    const { result } = renderHook(() => usePullToRefresh({ onRefresh: vi.fn(), threshold: 80 }))
    expect(result.current.pullProgress).toBe(0)
    expect(result.current.isRefreshing).toBe(false)
  })

  it('does not call onRefresh when pull distance is below threshold', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold }),
      { initialProps: { fn: onRefresh, threshold: 80 } }
    )
    attachDiv(result, rerender, div, onRefresh, 80)

    // 30px pull × 0.5 resistance = 15px → below 80px threshold
    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(200)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(230)))
    })
    act(() => { div.dispatchEvent(new Event('touchend')) })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('calls onRefresh when pull distance exceeds threshold', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    // threshold=30: deltaY=200px, 200>30 → resistance=0.3 → pullDistance=60 ≥ 30 ✓
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold }),
      { initialProps: { fn: onRefresh, threshold: 30 } }
    )
    attachDiv(result, rerender, div, onRefresh, 30)

    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(0)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(200)))
    })
    // Separate act: lets React flush pullDistance state + re-register listeners
    // so onTouchEnd closes over the updated pullDistance (60 ≥ 30).
    await act(async () => {
      div.dispatchEvent(new Event('touchend'))
      await Promise.resolve()
    })

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not start pull when scrollTop > 0', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold }),
      { initialProps: { fn: onRefresh, threshold: 30 } }
    )
    attachDiv(result, rerender, div, onRefresh, 30)
    ;(div as HTMLDivElement & { scrollTop: number }).scrollTop = 50

    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(0)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(200)))
    })
    await act(async () => {
      div.dispatchEvent(new Event('touchend'))
      await Promise.resolve()
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('does not pull when disabled', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold, disabled: true }),
      { initialProps: { fn: onRefresh, threshold: 30 } }
    )
    attachDiv(result, rerender, div, onRefresh, 30)

    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(0)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(200)))
    })
    await act(async () => {
      div.dispatchEvent(new Event('touchend'))
      await Promise.resolve()
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('resets pullProgress to 0 after release below threshold', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold }),
      { initialProps: { fn: onRefresh, threshold: 80 } }
    )
    attachDiv(result, rerender, div, onRefresh, 80)

    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(100)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(130))) // 15px after resistance — below threshold
    })
    act(() => { div.dispatchEvent(new Event('touchend')) })

    expect(result.current.pullProgress).toBe(0)
  })

  it('does not build pull distance on upward swipe', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold }),
      { initialProps: { fn: onRefresh, threshold: 80 } }
    )
    attachDiv(result, rerender, div, onRefresh, 80)

    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(300)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(100))) // upward swipe
      div.dispatchEvent(new Event('touchend'))
    })

    expect(onRefresh).not.toHaveBeenCalled()
    expect(result.current.pullProgress).toBe(0)
  })

  it('reports isRefreshing=true while onRefresh is pending', async () => {
    let resolveRefresh!: () => void
    const onRefresh = vi.fn().mockReturnValue(new Promise<void>(r => { resolveRefresh = r }))
    // threshold=30: deltaY=200 → pullDistance=60 ≥ 30 ✓
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold }),
      { initialProps: { fn: onRefresh, threshold: 30 } }
    )
    attachDiv(result, rerender, div, onRefresh, 30)

    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(0)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(200)))
    })
    await act(async () => {
      div.dispatchEvent(new Event('touchend'))
      await Promise.resolve()
    })

    expect(result.current.isRefreshing).toBe(true)

    await act(async () => { resolveRefresh() })
    expect(result.current.isRefreshing).toBe(false)
  })

  it('caps pullProgress at 1.0 regardless of pull distance', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ fn, threshold }) => usePullToRefresh({ onRefresh: fn, threshold }),
      { initialProps: { fn: onRefresh, threshold: 80 } }
    )
    attachDiv(result, rerender, div, onRefresh, 80)

    await act(async () => {
      div.dispatchEvent(Object.assign(new Event('touchstart'), touch(0)))
      div.dispatchEvent(Object.assign(new Event('touchmove'),  touch(2000)))
    })

    expect(result.current.pullProgress).toBeLessThanOrEqual(1)
  })
})

// ─── Scroll container class contract ─────────────────────────────────────────

describe('Scroll container class contract', () => {
  it('PullToRefreshWrapper root div has flex-1 min-h-0 and overflow-y-auto', () => {
    const src = readSrc('components/PullToRefreshWrapper.tsx')
    expect(src).toContain('flex-1')
    expect(src).toContain('min-h-0')
    expect(src).toContain('overflow-y-auto')
  })

  it('AppLayout outer div uses h-[100dvh] and overflow-hidden for definite scroll height', () => {
    const src = readSrc('app/(app)/layout.tsx')
    expect(src).toContain('h-[100dvh]')
    expect(src).toContain('overflow-hidden')
  })

  it('AppLayout main element has overflow-hidden to constrain scroll to child containers', () => {
    const src = readSrc('app/(app)/layout.tsx')
    const mainMatch = src.match(/<main[^>]+>/)
    expect(mainMatch).not.toBeNull()
    expect(mainMatch![0]).toContain('overflow-hidden')
  })

  it('AppLayout main element has pb-28 for navbar clearance', () => {
    const src = readSrc('app/(app)/layout.tsx')
    const mainMatch = src.match(/<main[^>]+>/)
    expect(mainMatch).not.toBeNull()
    expect(mainMatch![0]).toContain('pb-28')
  })

  it('new-request page root div has flex-1 min-h-0 and overflow-y-auto (no PullToRefresh)', () => {
    const src = readSrc('app/(app)/requests/new/page.tsx')
    expect(src).toContain('flex-1')
    expect(src).toContain('min-h-0')
    expect(src).toContain('overflow-y-auto')
  })

  it('edit-request page root div has flex-1 min-h-0 and overflow-y-auto (no PullToRefresh)', () => {
    const src = readSrc('app/(app)/requests/[id]/edit/page.tsx')
    expect(src).toContain('flex-1')
    expect(src).toContain('min-h-0')
    expect(src).toContain('overflow-y-auto')
  })
})
