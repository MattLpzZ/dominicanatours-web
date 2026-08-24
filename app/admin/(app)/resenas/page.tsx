import ResenaClient from './ResenaClient'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function ResenasPage() {
  const [pending, approved, avgResult] = await Promise.all([
    prisma.review.findMany({
      where: { approved: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { tour: { select: { name: true } } },
    }),
    prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { tour: { select: { name: true } } },
    }),
    prisma.review.aggregate({
      where: { approved: true },
      _avg: { rating: true },
      _count: { id: true },
    }),
  ])

  const toursWithReviews = new Set(approved.map(r => r.tourId)).size
  const avgRating = avgResult._avg.rating ? avgResult._avg.rating.toFixed(1) : null

  const serialize = (list: typeof pending) =>
    list.map(r => ({
      id: r.id,
      tourId: r.tourId,
      tourName: r.tour?.name ?? '—',
      firstName: r.firstName,
      country: r.country,
      rating: r.rating,
      comment: r.comment,
      approved: r.approved,
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-dt-text">Reseñas</h1>
        <p className="text-dt-text-3 text-sm mt-0.5">Modera y aprueba las opiniones de los clientes</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes', value: pending.length, color: 'text-amber-400', note: 'esperando moderación' },
          { label: 'Aprobadas', value: approved.length, color: 'text-emerald-400', note: 'visibles en el sitio' },
          { label: 'Puntuación media', value: avgRating ? `${avgRating} ★` : '—', color: 'text-yellow-400', note: 'de reseñas aprobadas' },
          { label: 'Tours calificados', value: toursWithReviews, color: 'text-blue-400', note: 'tours con reseñas' },
        ].map(s => (
          <div key={s.label} className="bg-dt-surface rounded-xl border border-dt-border p-4">
            <p className="text-dt-text-3 text-xs uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-display font-bold text-3xl ${s.color}`}>{s.value}</p>
            <p className="text-dt-text-3 text-xs mt-0.5">{s.note}</p>
          </div>
        ))}
      </div>

      <ResenaClient
        pending={serialize(pending)}
        approved={serialize(approved)}
      />
    </div>
  )
}
