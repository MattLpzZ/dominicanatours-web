export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const accommodations = await prisma.accommodation.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { images: true } } },
  })
  return NextResponse.json({ ok: true, accommodations })
}

export async function POST(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  if (!b.name) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  let slug = slugify(b.name)
  const exists = await prisma.accommodation.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now()}`

  const accommodation = await prisma.accommodation.create({
    data: {
      slug, name: b.name, type: b.type ?? 'hotel',
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
  return NextResponse.json({ ok: true, accommodation }, { status: 201 })
}
