export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const accommodation = await prisma.accommodation.findUnique({
    where: { id: parseInt(id) },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!accommodation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, accommodation })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  const accommodation = await prisma.accommodation.update({
    where: { id: parseInt(id) },
    data: {
      name: b.name, type: b.type ?? 'hotel',
      stars: b.stars ? parseInt(b.stars) : null,
      shortDescription: b.shortDescription || null,
      description: b.description || null,
      province: b.province || null, address: b.address || null,
      priceMin: b.priceMin ? parseFloat(b.priceMin) : null,
      priceMax: b.priceMax ? parseFloat(b.priceMax) : null,
      phone: b.phone || null, email: b.email || null,
      website: b.website || null, bookingUrl: b.bookingUrl || null,
      amenities: b.amenities || null, coverImage: b.coverImage || null,
      featured: b.featured === true, comingSoon: b.comingSoon === true, active: b.active !== false,
    },
  })
  return NextResponse.json({ ok: true, accommodation })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.accommodation.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
