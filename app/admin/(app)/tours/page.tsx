import Link from 'next/link'
import ToursClient from './ToursClient'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export default async function ToursPage() {
  const tours = await prisma.tour.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true } },
      _count: { select: { reservations: true, dates: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-dt-text">Tours</h1>
        <Link href="/admin/tours/nueva"
          className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors">
          + Nuevo tour
        </Link>
      </div>
      <ToursClient tours={tours.map(t => ({
        ...t,
        priceAdult: t.priceAdult.toString(),
        duration: t.duration ?? '',
        difficulty: t.difficulty ?? 'EASY',
        departureZone: t.departureZone ?? '',
      }))} />
    </div>
  )
}
