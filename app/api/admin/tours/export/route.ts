export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

function escape(val: unknown): string {
  const str = val == null ? '' : String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tours = await prisma.tour.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const HEADERS = ['name','subtitle','description','category','priceAdult','priceChild','costPrice','duration','difficulty','maxPeople','minAge','departureZone','departureTime','languages','active','featured']

  const rows = tours.map(t => [
    t.name, t.subtitle, t.description, t.category.name,
    t.priceAdult, t.priceChild,
    (t as unknown as { costPrice?: unknown }).costPrice ?? '',
    t.duration, t.difficulty, t.maxPeople, t.minAge,
    t.departureZone, t.departureTime, t.languages,
    t.active, t.featured,
  ].map(escape).join(','))

  const csv = [HEADERS.join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tours.csv"',
    },
  })
}

