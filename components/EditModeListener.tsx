'use client'
import { useEffect } from 'react'

export function EditModeListener() {
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('dt_edit')) return

    const handler = ({ data }: MessageEvent) => {
      if (!data || data.type !== 'DT_LIVE') return
      const { key, value } = data as { key: string; value: string }
      document.querySelectorAll<HTMLElement>(`[data-dt-key="${key}"]`).forEach(el => {
        el.textContent = value
      })
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return null
}
