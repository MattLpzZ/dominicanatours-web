import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const offers = await prisma.tourOffer.findMany({
    include: { tour: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ offers })
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { tourId, label, discountPercent, startsAt, endsAt } = await req.json()
  if (!tourId || !label || !discountPercent)
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  const offer = await prisma.tourOffer.create({
    data: { tourId: Number(tourId), label, discountPercent: Number(discountPercent), startsAt: new Date(startsAt), endsAt: new Date(endsAt) },
    include: { tour: { select: { name: true, slug: true } } },
  })
  return NextResponse.json({ offer }, { status: 201 })
}
