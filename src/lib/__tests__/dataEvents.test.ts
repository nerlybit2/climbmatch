import { describe, it, expect, vi } from 'vitest'
import { emit, on, type DataEvent } from '@/lib/dataEvents'

describe('dataEvents', () => {
  it('calls subscriber when event is emitted', () => {
    const cb = vi.fn()
    const unsub = on('post:created', cb)
    emit('post:created')
    expect(cb).toHaveBeenCalledTimes(1)
    unsub()
  })

  it('does not call subscriber for a different event', () => {
    const cb = vi.fn()
    const unsub = on('post:created', cb)
    emit('post:updated')
    expect(cb).not.toHaveBeenCalled()
    unsub()
  })

  it('supports multiple subscribers on the same event', () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const unsub1 = on('interest:created', cb1)
    const unsub2 = on('interest:created', cb2)
    emit('interest:created')
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(1)
    unsub1()
    unsub2()
  })

  it('unsubscribe stops future callbacks', () => {
    const cb = vi.fn()
    const unsub = on('app:resumed', cb)
    emit('app:resumed')
    expect(cb).toHaveBeenCalledTimes(1)
    unsub()
    emit('app:resumed')
    expect(cb).toHaveBeenCalledTimes(1) // still 1
  })

  it('supports all defined event types', () => {
    const events: DataEvent[] = [
      'post:created', 'post:updated', 'post:cancelled',
      'interest:created', 'interest:accepted', 'interest:declined',
      'app:resumed',
    ]
    for (const event of events) {
      const cb = vi.fn()
      const unsub = on(event, cb)
      emit(event)
      expect(cb).toHaveBeenCalledTimes(1)
      unsub()
    }
  })

  it('multiple emits call subscriber multiple times', () => {
    const cb = vi.fn()
    const unsub = on('post:cancelled', cb)
    emit('post:cancelled')
    emit('post:cancelled')
    emit('post:cancelled')
    expect(cb).toHaveBeenCalledTimes(3)
    unsub()
  })
})
