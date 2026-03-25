'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  disabled?: boolean
}

interface UsePullToRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement | null>
  isRefreshing: boolean
  pullProgress: number
  indicatorElement: React.ReactNode
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startYRef = useRef(0)
  const pullingRef = useRef(false)

  const pullProgress = Math.min(pullDistance / threshold, 1)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh])

  useEffect(() => {
    const el = containerRef.current
    if (!el || disabled) return

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY
        pullingRef.current = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current || isRefreshing) return
      const deltaY = e.touches[0].clientY - startYRef.current
      if (deltaY > 0) {
        // Apply resistance — pull gets harder as you pull further
        const resistance = deltaY > threshold ? 0.3 : 0.5
        setPullDistance(deltaY * resistance)
        if (deltaY * resistance > 10) {
          e.preventDefault()
        }
      } else {
        pullingRef.current = false
        setPullDistance(0)
      }
    }

    const onTouchEnd = () => {
      if (!pullingRef.current) return
      pullingRef.current = false
      if (pullDistance >= threshold) {
        handleRefresh()
      } else {
        setPullDistance(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [disabled, isRefreshing, pullDistance, threshold, handleRefresh])

  // The visual indicator element
  // Shows: a rotating arrow that fills with orange as you pull, turns into a spinner when refreshing
  const indicatorElement = (pullDistance > 0 || isRefreshing) ? (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ height: isRefreshing ? 48 : Math.min(pullDistance, threshold + 20) }}
    >
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md ${isRefreshing ? 'animate-spin' : ''}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${pullProgress * 180}deg)`,
          opacity: Math.min(pullProgress * 2, 1)
        }}
      >
        {isRefreshing ? (
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  ) : null

  return {
    containerRef,
    isRefreshing,
    pullProgress,
    indicatorElement,
  }
}
