'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { getInbox, getSentInterests, acceptInterest, declineInterest, getAcceptedContactInfo, type InboxItem } from '@/lib/actions/interests'

const CLIMBING_LABELS: Record<string, string> = {
  indoor: 'Indoor', sport: 'Sport', boulder: 'Boulder', trad: 'Trad', multi_pitch: 'Multi-pitch',
}

export default function InboxPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [received, setReceived] = useState<InboxItem[]>([])
  const [sent, setSent] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [contactInfo, setContactInfo] = useState<Record<string, { phone: string | null; displayName: string }>>({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([getInbox(), getSentInterests()])
      setReceived(r)
      setSent(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (interestId: string) => {
    try { await acceptInterest(interestId); await loadData() } catch (err) { console.error(err) }
  }

  const handleDecline = async (interestId: string) => {
    try { await declineInterest(interestId); await loadData() } catch (err) { console.error(err) }
  }

  const handleShowContact = async (interestId: string) => {
    try {
      const info = await getAcceptedContactInfo(interestId)
      if (info) setContactInfo(prev => ({ ...prev, [interestId]: info }))
    } catch (err) { console.error(err) }
  }

  const items = tab === 'received' ? received : sent
  const pendingCount = received.filter(r => r.interest.status === 'pending').length

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Manage your connections" />

      <div className="flex gap-1 mx-5 mb-5 bg-stone-100 rounded-2xl p-1">
        <button onClick={() => setTab('received')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${tab === 'received' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
          Received {pendingCount > 0 && <span className="ml-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] w-5 h-5 rounded-full inline-flex items-center justify-center">{pendingCount}</span>}
        </button>
        <button onClick={() => setTab('sent')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${tab === 'sent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
          Sent ({sent.length})
        </button>
      </div>

      <div className="px-5 space-y-3 pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 animate-pulse mx-auto mb-3" />
            <p className="text-gray-300 font-medium">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-gray-400 font-medium">No {tab} interests yet</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.interest.id} className="bg-white rounded-2xl p-4 card-shadow animate-fade-in">
              <div className="flex items-start gap-3">
                <img src={item.fromProfile.photo_url} alt={item.fromProfile.display_name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{item.fromProfile.display_name}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {CLIMBING_LABELS[item.request.climbing_type]} at {item.request.location_name}
                  </p>
                  <p className="text-[10px] text-gray-300 font-medium mt-0.5">{item.request.date}</p>

                  <div className="mt-3">
                    {item.interest.status === 'pending' && tab === 'received' && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleAccept(item.interest.id)} className="text-xs !px-4 !py-2">Accept</Button>
                        <Button variant="secondary" onClick={() => handleDecline(item.interest.id)} className="text-xs !px-4 !py-2">Decline</Button>
                      </div>
                    )}
                    {item.interest.status === 'pending' && tab === 'sent' && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-bold">Pending</span>
                    )}
                    {item.interest.status === 'accepted' && (
                      <div className="space-y-2">
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold">Accepted</span>
                        {contactInfo[item.interest.id] ? (
                          <div className="mt-2">
                            {contactInfo[item.interest.id].phone ? (
                              <a
                                href={`https://wa.me/${contactInfo[item.interest.id].phone!.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hey! I matched with you on ClimbMatch for ${item.request.climbing_type} at ${item.request.location_name} on ${item.request.date}. Let's climb! 🧗`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs px-4 py-2.5 rounded-2xl font-bold shadow-md shadow-green-500/20 active:scale-95 transition-all">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.359 0-4.55-.822-6.262-2.192l-.438-.362-2.657.891.891-2.657-.362-.438A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                </svg>
                                Open WhatsApp
                              </a>
                            ) : (
                              <p className="text-xs text-gray-400">No phone number provided</p>
                            )}
                          </div>
                        ) : (
                          <Button variant="secondary" onClick={() => handleShowContact(item.interest.id)} className="text-xs mt-1 !px-4 !py-2">Show Contact</Button>
                        )}
                      </div>
                    )}
                    {item.interest.status === 'declined' && (
                      <span className="text-xs text-red-400 bg-red-50 px-3 py-1 rounded-full font-bold">Declined</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
