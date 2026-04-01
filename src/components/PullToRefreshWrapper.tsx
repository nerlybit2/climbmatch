'use client'

import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface Props {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefreshWrapper({ onRefresh, children }: Props) {
  const { containerRef, indicatorElement } = usePullToRefresh({ onRefresh })

  return (
    <div ref={containerRef} className="h-full overflow-y-auto overscroll-contain">
      {indicatorElement}
      {children}
    </div>
  )
}
