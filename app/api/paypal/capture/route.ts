import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BASE_URL  = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const SECRET    = process.env.PAYPAL_CLIENT_SECRET

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://api.leymaken.com/api/public/web/dominicana-tour'

async function getToken() {
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  return (await res.json()).access_token as string
}

export async function POST(req: NextRequest) {
  const { token, PayerID } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const accessToken = await getToken()

  const captureRes = await fetch(`${BASE_URL}/v2/checkout/orders/${token}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  })
  const capture = await captureRes.json()
  if (!captureRes.ok) return NextResponse.json({ error: 'Capture failed', detail: capture }, { status: 502 })

  const pendingId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
  if (!pendingId) return NextResponse.json({ error: 'Missing custom_id' }, { status: 500 })

  const pending = await prisma.pendingPaypalPayment.findUnique({ where: { id: pendingId } })
  if (!pending) return NextResponse.json({ error: 'Pending payment not found' }, { status: 404 })

  const bookingData = JSON.parse(pending.bookingJson)
  const hubRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...bookingData, payment_method: 'paypal', paid_deposit: true }),
  })
  const hubJson = await hubRes.json()

  await prisma.pendingPaypalPayment.delete({ where: { id: pendingId } }).catch(() => {})

  if (!hubRes.ok) return NextResponse.json({ error: 'Booking failed', detail: hubJson }, { status: 502 })
  return NextResponse.json({ ok: true, booking: hubJson.data ?? hubJson })
}
