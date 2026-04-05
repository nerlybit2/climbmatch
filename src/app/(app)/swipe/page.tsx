import SwipeClient from './SwipeClient'
import { SwipeDiscoverProvider } from '@/contexts/SwipeDiscoverContext'

export default function SwipePage() {
  return (
    <SwipeDiscoverProvider>
      <SwipeClient />
    </SwipeDiscoverProvider>
  )
}
