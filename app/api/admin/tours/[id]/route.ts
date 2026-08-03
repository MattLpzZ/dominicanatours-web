export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[?-?]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const tour = await prisma.tour.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: { select: { id: true, name: true } },
      provider: { select: { id: true, name: true } },
      images: { orderBy: { order: 'asc' } },
      itinerary: { orderBy: { order: 'asc' } },
      includes: true,
      dates: { orderBy: { date: 'asc' } },
    },
  })
  if (!tour) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, tour })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  if (!b.name || !b.subtitle || !b.description || !b.priceAdult || !b.difficulty || !b.categoryId)
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })

  const tourId = parseInt(id)
  const existing = await prisma.tour.findUnique({ where: { id: tourId }, select: { slug: true } })
  if (!existing) return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 })

  let slug = existing.slug
  const newSlug = slugify(b.name)
  if (newSlug !== slug) {
    const conflict = await prisma.tour.findUnique({ where: { slug: newSlug } })
    if (!conflict) slug = newSlug
  }

  const tour = await prisma.tour.update({
    where: { id: tourId },
    data: {
      slug,
      name:          b.name,
      subtitle:      b.subtitle,
      description:   b.description,
      priceAdult:    parseFloat(b.priceAdult),
      priceChild:    parseFloat(b.priceChild || '0'),
      costPrice:     b.costPrice !== undefined && b.costPrice !== '' ? parseFloat(b.costPrice) : null,
      providerId:    b.providerId ? parseInt(String(b.providerId)) : null,
      duration:      b.duration || '',
      difficulty:    b.difficulty,
      categoryId:    parseInt(b.categoryId),
      maxPeople:     parseInt(b.maxPeople || '20'),
      minAge:        parseInt(b.minAge || '0'),
      departureZone: b.departureZone || '',
      departureTime: b.departureTime || '',
      languages:     b.languages || 'Espa?ol',
      active:        b.active !== false,
      featured:      b.featured === true,
    },
    include: {
      category: { select: { id: true, name: true } },
      provider: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ ok: true, tour })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const tourId = parseInt(id)
  const reservations = await prisma.reservation.count({ where: { tourId } })
  if (reservations > 0)
    return NextResponse.json({ error: `Este tour tiene ${reservations} reserva(s) activa(s). No se puede eliminar.` }, { status: 409 })
  await prisma.tour.delete({ where: { id: tourId } })
  return NextResponse.json({ ok: true })
}

