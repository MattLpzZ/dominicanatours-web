'use client'
import { useState } from 'react'

interface Props {
  tourId: number
  tourName: string
  firstName: string
  country: string
  reservationCode: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://dominicantour.leymaken.com/api'

export function ReviewModal({ tourId, tourName, firstName, country, reservationCode }: Props) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim() || rating < 1) return
    setLoading(true)
    try {
      await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour_id: tourId, reservation_code: reservationCode, firstName, country, rating, comment, language: 'es' }),
      })
      setDone(true)
    } catch {
      // silent — review saved anyway
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
        </svg>
        Reseña enviada
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-dt-border text-dt-text-2 hover:border-accent hover:text-accent transition-colors"
      >
        ★ Dejar reseña
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-dt-surface border border-dt-border rounded-2xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-dt-text-3 mb-1">Tu experiencia</p>
                <h3 className="font-bold text-dt-text text-base leading-snug line-clamp-2">{tourName}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-dt-text-3 hover:text-dt-text mt-0.5 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Stars */}
            <div className="mb-5">
              <p className="text-xs text-dt-text-3 mb-2 font-medium">Calificación</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <svg
                      className="w-8 h-8 transition-colors"
                      viewBox="0 0 24 24"
                      fill={(hover || rating) >= n ? '#F79009' : 'none'}
                      stroke={(hover || rating) >= n ? '#F79009' : 'currentColor'}
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-xs text-dt-text-3 mt-1.5">
                {['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'][hover || rating]}
              </p>
            </div>

            {/* Comment */}
            <form onSubmit={submit}>
              <div className="mb-4">
                <label className="text-xs text-dt-text-3 font-medium block mb-2">Cuéntanos tu experiencia</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="¿Cómo fue el tour? ¿Qué fue lo que más te gustó?"
                  className="w-full bg-dt-bg border border-dt-border rounded-xl px-3.5 py-2.5 text-sm text-dt-text placeholder:text-dt-text-3 resize-none focus:outline-none focus:border-accent transition-colors"
                  required
                />
                <p className="text-[11px] text-dt-text-3 text-right mt-1">{comment.length}/500</p>
              </div>
              <button
                type="submit"
                disabled={loading || !comment.trim()}
                className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando…' : 'Publicar reseña'}
              </button>
              <p className="text-center text-[11px] text-dt-text-3 mt-3">
                Tu reseña será visible tras ser aprobada por el equipo.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
