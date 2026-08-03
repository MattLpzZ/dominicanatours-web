'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TourDeleteBtn({ tourId, tourName }: { tourId: number; tourName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tours/${tourId}`, { method: 'DELETE' })
      if (res.ok) { router.refresh() }
      else { alert('No se pudo eliminar el tour'); setDeleting(false) }
    } catch {
      alert('Error al eliminar'); setDeleting(false)
    }
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-dt-text-3 hidden sm:block">Confirmar?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleting ? '...' : 'Si'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2.5 py-1 rounded border border-dt-border text-dt-text-3 text-xs hover:text-dt-text transition-colors"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1 rounded border border-red-800/40 text-red-400/70 hover:border-red-600 hover:text-red-400 text-xs transition-colors"
      title={`Eliminar ${tourName}`}
    >
      Eliminar
    </button>
  )
}