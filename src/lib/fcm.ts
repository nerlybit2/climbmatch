/**
 * Firebase Cloud Messaging v1 API — server-side notification sender.
 *
 * Requires env vars:
 *   FIREBASE_PROJECT_ID         — from Firebase console (project settings)
 *   FIREBASE_CLIENT_EMAIL       — service account email
 *   FIREBASE_PRIVATE_KEY        — service account private key (with \n escaped)
 */

import { GoogleAuth } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'

function getAuth() {
  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) return null

  return new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
}

async function getAccessToken(): Promise<string | null> {
  const auth = getAuth()
  if (!auth) return null
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token ?? null
}

interface FcmPayload {
  title: string
  body: string
  data?: Record<string, string>
}

/** Send a notification to a single FCM token. Returns false if token is stale. */
async function sendToToken(token: string, payload: FcmPayload, accessToken: string): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
        android: {
          priority: 'high',
          notification: { sound: 'default', channel_id: 'climbmatch_default' },
        },
      },
    }),
  })

  if (res.status === 404 || res.status === 410) return false // stale token
  return true
}

/** Send a push notification to all devices registered for a user. */
export async function sendNotification(
  userId: string,
  payload: FcmPayload,
): Promise<void> {
  // Skip if Firebase not configured
  if (!process.env.FIREBASE_PROJECT_ID) return

  const accessToken = await getAccessToken()
  if (!accessToken) return

  // Fetch device tokens using service role (bypasses RLS)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: rows } = await admin
    .from('device_tokens')
    .select('id, token')
    .eq('user_id', userId)

  if (!rows || rows.length === 0) return

  const staleIds: string[] = []

  await Promise.all(
    rows.map(async (row) => {
      const ok = await sendToToken(row.token, payload, accessToken)
      if (!ok) staleIds.push(row.id)
    }),
  )

  // Clean up stale tokens
  if (staleIds.length > 0) {
    await admin.from('device_tokens').delete().in('id', staleIds)
  }
}
