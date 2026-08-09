import nodemailer from 'nodemailer'

function getTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? '172.18.0.1',
    port:   Number(process.env.SMTP_PORT ?? 25),
    secure: false,
    ...(process.env.SMTP_USER
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? process.env.SMTP_USER } }
      : {}),
    tls: { rejectUnauthorized: false },
  })
}

const FROM = process.env.SMTP_FROM ?? 'Dominicana Tour <noreply@mail.dynastydom.com>'

export interface OfferEmailData {
  tourName:        string
  tourSlug:        string
  tourImage?:      string | null
  offerLabel:      string
  discountPercent: number
  endsAt:          Date
  priceAdult:      number
  priceAdultOffer: number
}

function html(d: OfferEmailData): string {
  const endsLabel = new Date(d.endsAt).toLocaleDateString('es-DO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const savings = d.priceAdult - d.priceAdultOffer

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:540px;margin:32px auto 48px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">

    <div style="background:#111;padding:24px 32px">
      <span style="font-size:20px;font-weight:900;color:#fff">Dominicana</span>
      <span style="font-size:20px;font-weight:900;color:#E85D20">Tour</span>
    </div>

    ${d.tourImage ? `<img src="${d.tourImage}" alt="${d.tourName}" style="width:100%;height:220px;object-fit:cover;display:block">` : ''}

    <div style="background:linear-gradient(135deg,#E85D20,#c94d14);padding:28px 32px">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.1em">Oferta por tiempo limitado</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#fff;line-height:1.15">${d.discountPercent}% de descuento</p>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,.85)">${d.tourName}</p>
    </div>

    <div style="padding:32px">
      <div style="background:#FFF3ED;border:1px solid #E85D20;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 8px;font-size:13px;color:#888">Precio especial por persona</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px">
          <span style="font-size:18px;color:#bbb;text-decoration:line-through">$${d.priceAdult} USD</span>
          <span style="font-size:32px;font-weight:900;color:#E85D20">$${d.priceAdultOffer} USD</span>
        </div>
        <p style="margin:6px 0 0;font-size:12px;color:#E85D20;font-weight:700">Ahorras $${savings.toFixed(0)} por persona</p>
      </div>

      <div style="background:#FFF7F0;border-left:3px solid #E85D20;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#666">
          <strong style="color:#E85D20">Oferta válida hasta:</strong>
          <span style="text-transform:capitalize"> ${endsLabel}</span>
        </p>
      </div>

      <div style="text-align:center;margin-bottom:28px">
        <a href="https://dominicanatour.com/excursiones/${d.tourSlug}"
           style="display:inline-block;background:#E85D20;color:#fff;font-weight:700;
                  font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
          Ver oferta y reservar →
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#bbb;text-align:center">
        No deseas recibir estas alertas?
        <a href="https://dominicanatour.com/cuenta" style="color:#bbb">Desuscribirse</a>
      </p>
    </div>

    <div style="background:#F5F5F5;padding:16px 32px;text-align:center;border-top:1px solid #E8E8E8">
      <p style="margin:0;font-size:11px;color:#aaa">© 2026 Dominicana Tour · República Dominicana</p>
    </div>
  </div></body></html>`
}

export async function sendOfferAlert(
  subscribers: { email: string; name: string | null }[],
  data: OfferEmailData,
): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0
  const subject = `${data.discountPercent}% OFF · ${data.tourName} — Oferta por tiempo limitado`
  const body = html(data)
  for (const sub of subscribers) {
    try {
      await getTransport().sendMail({ from: FROM, to: sub.email, subject, html: body })
      sent++
    } catch { failed++ }
  }
  return { sent, failed }
}
