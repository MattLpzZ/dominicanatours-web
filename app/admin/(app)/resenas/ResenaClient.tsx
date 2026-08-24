'use client'
import { useState, useTransition } from 'react'

interface SerializedReview {
  id: number
  tourId: number | null
  tourName: string
  firstName: string
  country: string | null
  rating: number
  comment: string | null
  approved: boolean | null
  createdAt: string
}

interface Props {
  pending: SerializedReview[]
  approved: SerializedReview[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className="w-3 h-3" viewBox="0 0 24 24"
          style={{ fill: s <= rating ? '#E8B94F' : 'var(--color-border)' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

function ReviewCard({ review, onApprove, onReject }: {
  review: SerializedReview
  onApprove?: () => void
  onReject: () => void
}) {
  const [pending, start] = useTransition()
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 px-5 py-4 border-b border-dt-border last:border-0 hover:bg-dt-bg-2 transition-colors">
      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5">
        {review.firstName[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-dt-text text-sm">{review.firstName}</span>
          {review.country && <span className="text-dt-text-3 text-xs">· {review.country}</span>}
          <Stars rating={review.rating} />
          <span className="text-dt-text-3 text-xs ml-auto">{timeAgo(review.createdAt)}</span>
        </div>
        <p className="text-xs text-accent/70 mb-1.5">{review.tourName}</p>
        {review.comment && (
          <p className="text-sm text-dt-text-2 leading-relaxed">{review.comment}</p>
        )}
      </div>

      <div className="flex gap-2 shrink-0 sm:flex-col sm:items-end">
        {onApprove && (
          <button
            disabled={pending}
            onClick={() => start(onApprove)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Aprobar
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => start(onReject)}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap border',
            onApprove
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/25'
              : 'bg-dt-bg text-dt-text-3 hover:text-red-400 hover:border-red-500/25 border-dt-border',
          ].join(' ')}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          {onApprove ? 'Rechazar' : 'Quitar'}
        </button>
      </div>
    </div>
  )
}

export default function ResenaClient({ pending: initialPending, approved: initialApproved }: Props) {
  const [pending, setPending]   = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)
  const [tab, setTab]           = useState<'pending' | 'approved'>('pending')

  async function approve(id: number) {
    await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ approved: true }), headers: { 'Content-Type': 'application/json' } })
    const moved = pending.find(r => r.id === id)
    setPending(p => p.filter(r => r.id !== id))
    if (moved) setApproved(a => [{ ...moved, approved: true }, ...a])
  }

  async function reject(id: number) {
    await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ approved: false }), headers: { 'Content-Type': 'application/json' } })
    setPending(p => p.filter(r => r.id !== id))
    setApproved(a => a.filter(r => r.id !== id))
  }

  const tabs = [
    { key: 'pending'  as const, label: 'Pendientes', count: pending.length },
    { key: 'approved' as const, label: 'Aprobadas',  count: approved.length },
  ]

  const list = tab === 'pending' ? pending : approved

  return (
    <div className="bg-dt-surface rounded-xl border border-dt-border overflow-hidden">
      <div className="flex border-b border-dt-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2',
              tab === t.key ? 'text-accent border-accent bg-accent/5' : 'text-dt-text-3 border-transparent hover:text-dt-text',
            ].join(' ')}
          >
            {t.label}
            <span className={[
              'text-xs px-2 py-0.5 rounded-full font-bold',
              tab === t.key ? 'bg-accent/15 text-accent' : 'bg-dt-bg-2 text-dt-text-3',
            ].join(' ')}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="py-14 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p className="text-dt-text-3 text-sm">
            {tab === 'pending' ? 'Sin reseñas pendientes' : 'Sin reseñas aprobadas aún'}
          </p>
          {tab === 'approved' && (
            <p className="text-dt-text-3 text-xs mt-1">Las reseñas aprobadas aparecen en la página de cada tour.</p>
          )}
        </div>
      ) : (
        <div>
          {list.map(r => (
            <ReviewCard
              key={r.id}
              review={r}
              onApprove={tab === 'pending' ? () => approve(r.id) : undefined}
              onReject={() => reject(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
