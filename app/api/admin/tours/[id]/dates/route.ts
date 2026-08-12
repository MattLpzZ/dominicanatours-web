export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const dates = await prisma.tourDate.findMany({
    where: { tourId: parseInt(id) },
    orderBy: { date: 'asc' },
    include: { _count: { select: { reservations: true } } },
  })
  return NextResponse.json({ ok: true, dates })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  if (!b.date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  const date = await prisma.tourDate.create({
    data: {
      tourId: parseInt(id),
      date: new Date(b.date + 'T12:00:00Z'),
      availableSpots: parseInt(b.availableSpots ?? '20'),
      bookedSpots: 0,
      status: 'OPEN',
    },
    include: { _count: { select: { reservations: true } } },
  })
  return NextResponse.json({ ok: true, date }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dateId = parseInt(new URL(req.url).searchParams.get('dateId') ?? '0')
  if (!dateId) return NextResponse.json({ error: 'dateId required' }, { status: 400 })
  await prisma.tourDate.delete({ where: { id: dateId } })
  return NextResponse.json({ ok: true })
}
