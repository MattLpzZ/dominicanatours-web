import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmation } from '@/lib/email'

const BASE     = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.leymaken.com/api/public/web/dominicana-tour'
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT  = process.env.TELEGRAM_CHAT_ID

async function notifyTelegram(booking: {
  code: string
  first_name: string; last_name?: string | null
  phone: string; email?: string | null
  adults: number; children: number
  payment_method: string
  product?: { name: string } | null
  availability?: { date: string } | null
  coupon_code?: string | null
}) {
  if (!TG_TOKEN || !TG_CHAT) return
  const METHOD: Record<string, string> = {
    whatsapp: 'WhatsApp \u{1F4AC}', card: 'Tarjeta \u{1F4B3}', paypal: 'PayPal',
  }
  const tourName = booking.product?.name ?? 'Excursión'
  const tourDate = booking.availability?.date
    ? new Date(booking.availability.date + 'T12:00:00')
        .toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin fecha'
  const paxLabel = booking.children > 0
    ? `${booking.adults} adulto${booking.adults !== 1 ? 's' : ''} + ${booking.children} niño${booking.children !== 1 ? 's' : ''}`
    : `${booking.adults} adulto${booking.adults !== 1 ? 's' : ''}`

  const lines = [
    `\u{1F3AB} <b>Nueva reserva</b>`,
    `\u{1F194} <code>${booking.code}</code>`,
    ``,
    `<b>Tour:</b> ${tourName}`,
    `<b>Fecha:</b> ${tourDate}`,
    `<b>Pax:</b> ${paxLabel}`,
    ``,
    `<b>Cliente:</b> ${booking.first_name} ${booking.last_name ?? ''}`.trimEnd(),
    `<b>Tel:</b> <code>${booking.phone}</code>`,
    booking.email ? `<b>Email:</b> ${booking.email}` : null,
    `<b>Pago:</b> ${METHOD[booking.payment_method] ?? booking.payment_method}`,
    booking.coupon_code ? `<b>Cupón:</b> <code>${booking.coupon_code}</code>` : null,
    ``,
    `<a href="https://dominicanatour.com/admin/reservas">Ver en panel \u{2197}️</a>`,
  ].filter((l): l is string => l !== null).join('\n')

  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text: lines, parse_mode: 'HTML', disable_web_page_preview: true }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { coupon_code, ...bookingData } = body

  const res  = await fetch(`${BASE}/bookings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  })
  const json = await res.json()
  if (!res.ok) return NextResponse.json(json, { status: res.status })

  const booking = json.data ?? json

  // Coupon usage (non-fatal)
  if (coupon_code) {
    prisma.coupon.updateMany({
      where: { code: coupon_code.toUpperCase(), active: true },
      data:  { usedCount: { increment: 1 } },
    }).catch(() => {})
  }

  // Telegram notification (non-fatal)
  notifyTelegram({
    code:           booking.code,
    first_name:     booking.first_name  ?? bookingData.first_name,
    last_name:      booking.last_name   ?? bookingData.last_name,
    phone:          booking.phone       ?? bookingData.phone,
    email:          booking.email       ?? bookingData.email,
    adults:         booking.adults      ?? bookingData.adults,
    children:       booking.children    ?? bookingData.children,
    payment_method: booking.payment_method ?? bookingData.payment_method,
    product:        booking.product     ?? null,
    availability:   booking.availability ?? null,
    coupon_code:    coupon_code ?? null,
  }).catch(() => {})

  // Email confirmation to client (non-fatal)
  const clientEmail = booking.email ?? bookingData.email
  if (clientEmail) {
    sendBookingConfirmation({
      code:          booking.code,
      firstName:     booking.first_name  ?? bookingData.first_name ?? '',
      lastName:      booking.last_name   ?? bookingData.last_name  ?? null,
      email:         clientEmail,
      tourName:      booking.product?.name ?? bookingData.product?.name ?? 'Excursión',
      tourDate:      booking.availability?.date ?? null,
      adults:        Number(booking.adults      ?? bookingData.adults      ?? 1),
      children:      Number(booking.children    ?? bookingData.children    ?? 0),
      totalAmount:   Number(booking.total_amount ?? 0),
      depositAmount: Number(booking.deposit_amount ?? 0),
      paymentMethod: booking.payment_method ?? bookingData.payment_method ?? '',
    }).catch(() => {})
  }

  return NextResponse.json(json)
}
