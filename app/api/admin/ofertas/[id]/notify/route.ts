import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOfferAlert } from '@/lib/email-offer'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offer = await prisma.tourOffer.findUnique({
    where: { id: Number(id) },
    include: { tour: { include: { images: { orderBy: { order: 'asc' }, take: 1 } } } },
  })
  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })

  const subscribers = await prisma.customer.findMany({
    where: { subscribed: true },
    select: { email: true, name: true },
  })
  if (subscribers.length === 0) return NextResponse.json({ sent: 0, failed: 0, message: 'No subscribers' })

  const priceAdultOffer = Math.round(Number(offer.tour.priceAdult) * (1 - offer.discountPercent / 100))
  const result = await sendOfferAlert(subscribers, {
    tourName:        offer.tour.name,
    tourSlug:        offer.tour.slug,
    tourImage:       offer.tour.images[0]?.url ?? null,
    offerLabel:      offer.label,
    discountPercent: offer.discountPercent,
    endsAt:          offer.endsAt,
    priceAdult:      Number(offer.tour.priceAdult),
    priceAdultOffer,
  })
  return NextResponse.json(result)
}
