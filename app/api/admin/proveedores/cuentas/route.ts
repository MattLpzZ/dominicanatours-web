export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month') // "2026-07"

  let startDate: Date
  let endDate: Date

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split('-').map(Number)
    startDate = new Date(year, month - 1, 1)
    endDate   = new Date(year, month, 1)
  } else {
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  // Get all providers with their tours and reservations in the period
  const providers = await prisma.provider.findMany({
    where: { active: true },
    include: {
      tours: {
        where: { active: true, costPrice: { not: null } },
        include: {
          reservations: {
            where: {
              status: { in: ['CONFIRMED', 'COMPLETED'] },
              createdAt: { gte: startDate, lt: endDate },
            },
            select: { adults: true, children: true, totalAmount: true },
          },
        },
        select: {
          id: true, name: true, costPrice: true,
          reservations: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Build payables summary
  const payables = providers
    .map(provider => {
      const tours = provider.tours
        .filter(t => t.reservations.length > 0)
        .map(t => {
          const cost = t.costPrice ? Number(t.costPrice) : null
          const reservations = t.reservations.length
          const people = t.reservations.reduce((s, r) => s + r.adults + r.children, 0)
          const totalCost = cost !== null ? cost * people : null
          return {
            tourId: t.id, tourName: t.name,
            providerName: provider.name,
            costPrice: cost, reservations, people,
            totalCost,
          }
        })

      const totalReservations = tours.reduce((s, t) => s + t.reservations, 0)
      const totalPeople = tours.reduce((s, t) => s + t.people, 0)
      const totalCost = tours.reduce((s, t) => s + (t.totalCost ?? 0), 0)

      return {
        providerId: provider.id, providerName: provider.name,
        tours, totalReservations, totalPeople, totalCost,
      }
    })
    .filter(p => p.tours.length > 0)

  return NextResponse.json({ ok: true, payables })
}

