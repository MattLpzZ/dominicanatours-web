export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const countOnly = url.searchParams.get('count') === '1'
  const format    = url.searchParams.get('format')
  const country   = url.searchParams.get('country')?.toLowerCase()
  const zone      = url.searchParams.get('zone')?.toLowerCase()

  const reservas = await prisma.reservation.findMany({
    where: {
      status: { not: 'CANCELLED' },
      ...(country ? { country: { contains: country } } : {}),
      ...(zone    ? { hotelZone: { contains: zone } } : {}),
    },
    select: {
      firstName: true, lastName: true, email: true, phone: true,
      country: true, hotelZone: true, language: true,
      totalAmount: true,
      tour: { select: { name: true } },
      tourDate: { select: { date: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const map = new Map<string, {
    email: string; phone: string; firstName: string; lastName: string
    country: string; hotelZone: string; language: string
    bookings: number; totalSpent: number; lastTour: string; lastDate: string
  }>()

  reservas.forEach(r => {
    const key = r.phone || r.email
    if (!key) return
    const dateStr = r.tourDate.date instanceof Date
      ? r.tourDate.date.toISOString()
      : String(r.tourDate.date)
    if (map.has(key)) {
      const e = map.get(key)!
      e.bookings++
      e.totalSpent += Number(r.totalAmount)
      if (new Date(dateStr) > new Date(e.lastDate)) {
        e.lastTour = r.tour.name
        e.lastDate = dateStr
      }
    } else {
      map.set(key, {
        email:     r.email,
        phone:     r.phone,
        firstName: r.firstName,
        lastName:  r.lastName,
        country:   r.country,
        hotelZone: r.hotelZone,
        language:  r.language,
        bookings:  1,
        totalSpent: Number(r.totalAmount),
        lastTour:  r.tour.name,
        lastDate:  dateStr,
      })
    }
  })

  const contacts = [...map.values()].sort((a, b) => b.bookings - a.bookings)

  if (countOnly) {
    return NextResponse.json({ total: contacts.length })
  }

  if (format === 'csv') {
    const rows = [
      ['Nombre','Apellido','Email','Telefono','Pais','Zona Hotel','Idioma','Reservas','Total Gastado','Ultimo Tour','Ultima Fecha'],
      ...contacts.map(c => [
        c.firstName, c.lastName, c.email, c.phone, c.country, c.hotelZone,
        c.language, c.bookings, c.totalSpent.toFixed(2), c.lastTour,
        c.lastDate ? c.lastDate.slice(0, 10) : '',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contactos-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  }

  return NextResponse.json({ ok: true, contacts, total: contacts.length })
}
