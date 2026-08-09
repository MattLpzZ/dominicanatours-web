'use client'
import { useEffect } from 'react'

export function GaConsentRestorer() {
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )dt-consent=([^;]*)/)
    const consent = match ? decodeURIComponent(match[1]) : null
    if (!consent || typeof window === 'undefined') return
    const g = (window as any).gtag
    if (typeof g !== 'function') return
    if (consent === 'all') {
      g('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
    } else {
      g('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
    }
  }, [])
  return null
}
