export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { getTransport } from '@/lib/email-marketing'

// ── Branded wrapper for admin-written campaign content ────────────────────────
function wrapCampaignHtml(content: string, recipientName: string): string {
  // Already a full HTML document — send as-is
  if (/^\s*<!doctype|^\s*<html/i.test(content)) return content
  // Convert plain-text newlines to <br> if no HTML tags found
  const htmlContent = /<[a-z]/i.test(content)
    ? content
    : content.replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2F2F2">
<tr><td align="center" style="padding:32px 16px 48px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

  <tr><td bgcolor="#111111" style="background-color:#111111;padding:22px 32px;border-radius:12px 12px 0 0">
    <span style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">Dominicana</span><span style="font-size:20px;font-weight:900;color:#1d70b7;letter-spacing:-0.5px">Tour</span>
  </td></tr>

  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:32px">
    <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111111">Hola, ${recipientName}.</p>
    <div style="font-size:15px;color:#444444;line-height:1.7;margin-top:16px">${htmlContent}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid #EEEEEE">
      <tr><td style="padding-top:20px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-right:12px;vertical-align:middle">
              <a href="https://wa.me/18095550100" style="display:inline-block;background-color:#25D366;color:#ffffff;font-weight:700;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">WhatsApp</a>
            </td>
            <td style="vertical-align:middle">
              <a href="https://dominicanatour.com/excursiones" style="display:inline-block;background-color:#1d70b7;color:#ffffff;font-weight:700;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none">Ver excursiones</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <tr><td bgcolor="#F5F5F5" style="background-color:#F5F5F5;padding:16px 32px;text-align:center;border-top:1px solid #E8E8E8;border-radius:0 0 12px 12px">
    <p style="margin:0;font-size:11px;color:#aaaaaa;line-height:1.7">
      © 2026 Dominicana Tour · República Dominicana<br>
      Recibes este mensaje porque reservaste o consultaste con nosotros.<br>
      <a href="https://dominicanatour.com/cuenta" style="color:#bbbbbb;text-decoration:underline">Desuscribirse</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

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

  const where: Record<string, unknown> = { status: { not: 'CANCELLED' } }
  if (filterCountry) where.country = { contains: filterCountry }
  if (filterZone)    where.hotelZone = { contains: filterZone }

  const reservas = await prisma.reservation.findMany({
    where,
    select: { email: true, phone: true, firstName: true, lastName: true },
    orderBy: { createdAt: 'desc' },
  })

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
    const from = process.env.SMTP_FROM ?? 'Dominicana Tour <noreply@dominicanatour.com>'
    for (const rec of recipients) {
      if (!rec.email) continue
      try {
        await transport.sendMail({
          from,
          to:      rec.email,
          subject,
          html:    wrapCampaignHtml(msgBody, rec.firstName),
        })
        sentCount++
      } catch { /* non-fatal */ }
    }
    status = 'SENT'
    sentAt = new Date()
  } else if (sendNow && type === 'WHATSAPP') {
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

  const phoneList = (sendNow && type === 'WHATSAPP')
    ? recipients.filter(r => r.phone).map(r => ({
        phone: r.phone,
        name:  r.firstName,
        message: msgBody.replace(/\{nombre\}/gi, r.firstName),
      }))
    : undefined

  return NextResponse.json({ ok: true, campaign, phoneList })
}
