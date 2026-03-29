import { discoverRequests } from '@/lib/actions/discover'
import DiscoverClient from './DiscoverClient'

export default async function DiscoverPage() {
  const initialCards = await discoverRequests({})
  return <DiscoverClient initialCards={initialCards} />
}
