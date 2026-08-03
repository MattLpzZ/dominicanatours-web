export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const month  = url.searchParams.get('month')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    where.tourDate = { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } }
  }

  const reservas = await prisma.reservation.findMany({
    where,
    include: {
      tour: { select: { name: true, slug: true } },
      tourDate: { select: { date: true } },
    },
    orderBy: { tourDate: { date: 'asc' } },
    take: 500,
  })
  return NextResponse.json({ ok: true, reservas })
}
