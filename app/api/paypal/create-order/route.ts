import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BASE_URL  = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const SECRET    = process.env.PAYPAL_CLIENT_SECRET

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  if (!CLIENT_ID || !SECRET) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })
  }
  const body = await req.json()
  const { bookingData, depositAmount } = body
  if (!bookingData || !depositAmount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const pendingId = crypto.randomUUID()
  await prisma.pendingPaypalPayment.create({
    data: { id: pendingId, bookingJson: JSON.stringify(bookingData), depositAmount },
  })

  const appBase = process.env.NEXTAUTH_URL ?? 'https://dominicanatour.com'
  const token   = await getAccessToken()

  const orderRes = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: Number(depositAmount).toFixed(2) },
        description: `Anticipo 30% · ${bookingData.product_name ?? 'Excursión'}`,
        custom_id: pendingId,
      }],
      application_context: {
        brand_name: 'Dominicana Tour',
        return_url: `${appBase}/pagos/paypal/success`,
        cancel_url: `${appBase}/excursiones`,
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    }),
  })
  const order = await orderRes.json()

  if (!orderRes.ok) {
    await prisma.pendingPaypalPayment.delete({ where: { id: pendingId } })
    return NextResponse.json({ error: 'PayPal order failed', detail: order }, { status: 502 })
  }

  await prisma.pendingPaypalPayment.update({
    where: { id: pendingId },
    data: { paypalOrderId: order.id },
  })

  const approvalLink = order.links?.find((l: { rel: string }) => l.rel === 'approve')?.href
  return NextResponse.json({ approvalUrl: approvalLink, pendingId })
}
