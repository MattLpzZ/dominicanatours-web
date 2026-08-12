'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Suspense } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://dominicantour.leymaken.com/api'

interface Props {
  tourId: number
  tourSlug: string
  tourName: string
}

function ReviewForm({ tourId, tourName }: Props) {
  const params   = useSearchParams()
  const router   = useRouter()
  const pathname = usePathname()

  const shouldOpen    = params.get('review') === '1'
  const code          = params.get('code') ?? ''
  const initialStars  = Math.min(5, Math.max(1, Number(params.get('stars') ?? 5)))

  const [open, setOpen]         = useState(false)
  const [rating, setRating]     = useState(initialStars)
  const [hover, setHover]       = useState(0)
  const [firstName, setName]    = useState('')
  const [country, setCountry]   = useState('DO')
  const [comment, setComment]   = useState('')
  const [submitting, setSub]    = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const overlay                 = useRef<HTMLDivElement>(null)

  useEffect(() => { if (shouldOpen) setOpen(true) }, [shouldOpen])

  function close() {
    setOpen(false)
    // Remove query params cleanly
    router.replace(pathname, { scroll: false })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) { setError('Por favor ingresa tu nombre.'); return }
    if (!comment.trim())   { setError('Por favor escribe un comentario.'); return }
    setError('')
    setSub(true)
    try {
      const r = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tour_id: tourId,
          reservation_code: code || undefined,
          firstName: firstName.trim(),
          country,
          rating,
          comment: comment.trim(),
          language: 'es',
        }),
      })
      if (!r.ok) throw new Error()
      setDone(true)
    } catch {
      setError('Error al enviar. Intenta de nuevo.')
    }
    setSub(false)
  }

  if (!open) return null

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlay.current) close() }}
    >
      <div className="w-full sm:max-w-md bg-dt-surface border border-dt-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dt-border">
          <div>
            <p className="font-display font-bold text-dt-text text-base leading-tight">¿Cómo estuvo tu tour?</p>
            <p className="text-dt-text-3 text-xs mt-0.5 truncate max-w-[240px]">{tourName}</p>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full flex items-center justify-center text-dt-text-3 hover:bg-dt-border transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {done ? (
          /* Success state */
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="font-display font-bold text-dt-text text-xl mb-2">¡Gracias por tu reseña!</p>
            <p className="text-dt-text-3 text-sm leading-relaxed">Tu opinión está pendiente de moderación y aparecerá pronto en la página del tour.</p>
            <button
              onClick={close}
              className="mt-6 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 py-5 flex flex-col gap-4">
            {/* Star picker */}
            <div className="flex flex-col items-center gap-2 py-2">
              <p className="text-dt-text-3 text-xs">Selecciona tu calificación</p>
              <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHover(s)}
                    onClick={() => setRating(s)}
                    className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`${s} estrella${s > 1 ? 's' : ''}`}
                  >
                    <svg
                      className="w-9 h-9 transition-colors"
                      viewBox="0 0 24 24"
                      style={{ fill: s <= (hover || rating) ? '#E8B94F' : 'var(--color-border)', filter: s <= (hover || rating) ? 'drop-shadow(0 0 4px rgba(232,185,79,0.4))' : 'none' }}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-sm font-semibold text-dt-text h-5">
                {(hover || rating) === 5 ? 'Excelente' : (hover || rating) === 4 ? 'Muy bueno' : (hover || rating) === 3 ? 'Bueno' : (hover || rating) === 2 ? 'Regular' : 'Malo'}
              </p>
            </div>

            {/* Name + country */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-dt-text-3 mb-1">Tu nombre *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setName(e.target.value)}
                  placeholder="María"
                  maxLength={60}
                  className="w-full bg-dt-bg border border-dt-border rounded-lg px-3 py-2 text-sm text-dt-text placeholder:text-dt-text-3 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dt-text-3 mb-1">País</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-dt-bg border border-dt-border rounded-lg px-3 py-2 text-sm text-dt-text focus:outline-none focus:border-accent/50 transition-colors"
                >
                  <option value="DO">RD</option>
                  <option value="US">EE.UU.</option>
                  <option value="CA">Canadá</option>
                  <option value="MX">México</option>
                  <option value="CO">Colombia</option>
                  <option value="VE">Venezuela</option>
                  <option value="PR">Puerto Rico</option>
                  <option value="GB">Reino Unido</option>
                  <option value="DE">Alemania</option>
                  <option value="FR">Francia</option>
                  <option value="RU">Rusia</option>
                  <option value="BR">Brasil</option>
                  <option value="AR">Argentina</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-dt-text-3 mb-1">Tu experiencia *</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Cuéntanos cómo fue el tour, qué te gustó más..."
                rows={3}
                maxLength={1000}
                className="w-full bg-dt-bg border border-dt-border rounded-lg px-3 py-2 text-sm text-dt-text placeholder:text-dt-text-3 focus:outline-none focus:border-accent/50 transition-colors resize-none"
              />
              <p className="text-dt-text-3 text-[11px] mt-1 text-right">{comment.length}/1000</p>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Enviando...
                </>
              ) : 'Enviar reseña'}
            </button>
            <p className="text-dt-text-3 text-[11px] text-center">Tu reseña será revisada antes de publicarse.</p>
          </form>
        )}
      </div>
    </div>
  )
}

// Exported with Suspense boundary — required for useSearchParams() in App Router
export function ReviewModal(props: Props) {
  return (
    <Suspense fallback={null}>
      <ReviewForm {...props} />
    </Suspense>
  )
}
