/** Lightweight event bus for cross-context cache invalidation */

export type DataEvent =
  | 'post:created'
  | 'post:updated'
  | 'post:cancelled'
  | 'interest:created'
  | 'interest:accepted'
  | 'interest:declined'
  | 'app:resumed'

const target = new EventTarget()

export function emit(event: DataEvent): void {
  target.dispatchEvent(new Event(event))
}

/** Subscribe to an event. Returns an unsubscribe function. */
export function on(event: DataEvent, cb: () => void): () => void {
  target.addEventListener(event, cb)
  return () => target.removeEventListener(event, cb)
}
