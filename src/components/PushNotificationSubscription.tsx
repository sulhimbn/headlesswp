'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/utils/logger'

interface PushNotificationState {
  supported: boolean
  subscribed: boolean
  permission: NotificationPermission | null
}

export default function PushNotificationSubscription() {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    subscribed: false,
    permission: null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const supported = 'Notification' in window
    const permission = supported ? Notification.permission : null

    if ('serviceWorker' in navigator && supported) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setState({
            supported: true,
            subscribed: !!subscription,
            permission
          })
        })
      })
    } else {
      setState({ supported, subscribed: false, permission })
    }
  }, [])

  const subscribe = async () => {
    if (!state.supported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })

      setState(prev => ({ ...prev, subscribed: true }))
      logger.info('Push notification subscribed', { module: 'push-notification' })
    } catch (error) {
      logger.error('Push notification subscription failed', error, { module: 'push-notification' })
    }
  }

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })
      }

      setState(prev => ({ ...prev, subscribed: false }))
      logger.info('Push notification unsubscribed', { module: 'push-notification' })
    } catch (error) {
      logger.error('Push notification unsubscription failed', error, { module: 'push-notification' })
    }
  }

  if (!state.supported) return null

  if (state.permission === 'denied') {
    return (
      <p className="text-sm text-[hsl(var(--color-text-muted))]">
        Push notifications are blocked. Please enable them in your browser settings.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {state.subscribed ? (
        <button
          onClick={unsubscribe}
          className="px-4 py-2 text-sm bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-text-primary))] rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-secondary-dark))] transition-colors"
        >
          Unsubscribe
        </button>
      ) : (
        <button
          onClick={subscribe}
          className="px-4 py-2 text-sm bg-[hsl(var(--color-primary))] text-white rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-primary-dark))] transition-colors"
        >
          Subscribe to Notifications
        </button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}
