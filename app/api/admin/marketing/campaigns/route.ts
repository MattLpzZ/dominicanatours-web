export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { getTransport } from '@/lib/email-marketing'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ ok: true, campaigns })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, type, subject, body: msgBody, filterCountry, filterZone, sendNow } = body

  if (!name || !msgBody) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  if (type === 'EMAIL' && !subject) return NextResponse.json({ error: 'Falta asunto' }, { status: 400 })

  // Build recipient list
  const where: Record<string, unknown> = { status: { not: 'CANCELLED' } }
  if (filterCountry) where.country = { contains: filterCountry }
  if (filterZone)    where.hotelZone = { contains: filterZone }

  const reservas = await prisma.reservation.findMany({
    where,
    select: { email: true, phone: true, firstName: true, lastName: true },
    orderBy: { createdAt: 'desc' },
  })

  // Deduplicate
  const seen = new Set<string>()
  const recipients: { email: string; phone: string; firstName: string; lastName: string }[] = []
  reservas.forEach(r => {
    const key = r.phone || r.email
    if (key && !seen.has(key)) {
      seen.add(key)
      recipients.push(r)
    }
  })

  let sentCount = 0
  let status = 'DRAFT'
  let sentAt: Date | undefined

  if (sendNow && type === 'EMAIL') {
    const transport = getTransport()
    const from = process.env.SMTP_FROM ?? 'Dominicana Tour <noreply@mail.dynastydom.com>'
    for (const rec of recipients) {
      if (!rec.email) continue
      const personalBody = msgBody.replace(/\{nombre\}/gi, rec.firstName)
      try {
        await transport.sendMail({ from, to: rec.email, subject, html: personalBody })
        sentCount++
      } catch { /* non-fatal */ }
    }
    status = 'SENT'
    sentAt = new Date()
  } else if (sendNow && type === 'WHATSAPP') {
    // For WA campaigns, just mark as sent (manual sending)
    sentCount = recipients.filter(r => r.phone).length
    status = 'SENT'
    sentAt = new Date()
  }

  const campaign = await prisma.campaign.create({
    data: {
      name, type: type ?? 'EMAIL',
      subject: subject || null,
      body: msgBody,
      status,
      recipientCount: sendNow ? sentCount : recipients.length,
      sentAt: sentAt ?? null,
    },
  })

  // For WA campaigns that were "sent", return the phone list too
  const phoneList = (sendNow && type === 'WHATSAPP')
    ? recipients.filter(r => r.phone).map(r => ({ phone: r.phone, name: r.firstName, message: msgBody.replace(/\{nombre\}/gi, r.firstName) }))
    : undefined

  return NextResponse.json({ ok: true, campaign, phoneList })
}
