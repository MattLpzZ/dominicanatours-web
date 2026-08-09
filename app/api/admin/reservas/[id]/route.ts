export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmed } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { status, internalNotes, paidDeposit } = await req.json()
  const updated = await prisma.reservation.update({
    where: { id: parseInt(id) },
    data: {
      ...(status ? { status } : {}),
      ...(internalNotes !== undefined ? { internalNotes } : {}),
      ...(paidDeposit !== undefined ? { paidDeposit } : {}),
    },
    include: {
      tour:     { select: { name: true } },
      tourDate: { select: { date: true } },
    },
  })

  if (status === 'CONFIRMED' && updated.email) {
    sendBookingConfirmed({
      code:      updated.code,
      firstName: updated.firstName,
      email:     updated.email,
      tourName:  updated.tour?.name ?? 'Excursión',
      tourDate:  updated.tourDate?.date
        ? new Date(updated.tourDate.date).toISOString().slice(0, 10)
        : null,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, reserva: updated })
}
