export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [tours, reservas, pending, revenue] = await Promise.all([
    prisma.tour.count({ where: { active: true } }),
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.reservation.aggregate({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _sum: { totalAmount: true },
    }),
  ])
  return NextResponse.json({
    ok: true,
    tours,
    reservas,
    pending,
    revenue: Number(revenue._sum.totalAmount ?? 0),
  })
}
