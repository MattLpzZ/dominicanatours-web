import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// CORS headers for cross-origin requests from dominicantodo.com
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const url   = new URL(req.url)
  const city  = url.searchParams.get('city')   // filter by specific city/zone
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50)

  const where: Record<string, unknown> = { active: true }
  if (city) {
    where.departureZone = { contains: city }
  }

  const tours = await prisma.tour.findMany({
    where,
    select: {
      id:            true,
      name:          true,
      slug:          true,
      description:   true,
      priceAdult:    true,
      duration:      true,
      difficulty:    true,
      departureZone: true,
      images:        true,
      featured:      true,
      category: { select: { name: true } },
      _count: { select: { reservations: true } },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })

  // Group by departureZone
  const byCity: Record<string, typeof tours> = {}
  for (const t of tours) {
    const zone = t.departureZone || 'General'
    if (!byCity[zone]) byCity[zone] = []
    byCity[zone].push(t)
  }

  // Serialize Decimal
  const serializeTour = (t: (typeof tours)[0]) => ({
    ...t,
    priceAdult: Number(t.priceAdult),
    bookingUrl: `https://dominicanatour.com/reservar/${t.slug}`,
    // First image or null
    image: (() => {
      try {
        const imgs = typeof t.images === 'string' ? JSON.parse(t.images) : t.images
        return Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null
      } catch { return null }
    })(),
  })

  const cities = Object.entries(byCity).map(([city, tours]) => ({
    city,
    tourCount: tours.length,
    tours: tours.map(serializeTour),
  }))

  return NextResponse.json(
    {
      ok:          true,
      totalTours:  tours.length,
      cities,
      // If filtering by city, also return flat list for easy consumption
      ...(city ? { tours: tours.map(serializeTour) } : {}),
    },
    { headers: CORS }
  )
}
