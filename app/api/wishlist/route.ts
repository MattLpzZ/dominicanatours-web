import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function getCustomer(email: string) {
  return prisma.customer.findUnique({ where: { email } })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ items: [] })
  const customer = await getCustomer(session.user.email)
  if (!customer) return NextResponse.json({ items: [] })
  const items = await prisma.savedTour.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug, name, imageUrl, priceAdult, categoryIcon } = await req.json()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  const customer = await getCustomer(session.user.email)
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  await prisma.savedTour.upsert({
    where: { customerId_tourSlug: { customerId: customer.id, tourSlug: slug } },
    update: { tourName: name, tourImage: imageUrl ?? null, priceAdult, categoryIcon: categoryIcon ?? '' },
    create: { customerId: customer.id, tourSlug: slug, tourName: name, tourImage: imageUrl ?? null, priceAdult, categoryIcon: categoryIcon ?? '' },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await req.json()
  const customer = await getCustomer(session.user.email)
  if (!customer) return NextResponse.json({ ok: true })
  await prisma.savedTour.deleteMany({
    where: { customerId: customer.id, tourSlug: slug },
  })
  return NextResponse.json({ ok: true })
}
