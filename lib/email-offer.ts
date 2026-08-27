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

const FROM = process.env.SMTP_FROM ?? 'Dominicana Tour <noreply@dominicanatour.com>'

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
  const savings = (d.priceAdult - d.priceAdultOffer).toFixed(0)

  const imgRow = d.tourImage
    ? `<tr><td style="padding:0"><img src="${d.tourImage}" alt="${d.tourName}" width="600" style="display:block;width:100%;max-height:240px;object-fit:cover"></td></tr>`
    : ''

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

  ${imgRow}

  <tr><td bgcolor="#c94d14" style="background-color:#c94d14;padding:28px 32px">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.1em">Oferta por tiempo limitado</p>
    <p style="margin:0;font-size:30px;font-weight:900;color:#ffffff;line-height:1.15">${d.discountPercent}% de descuento</p>
    <p style="margin:6px 0 0;font-size:15px;color:rgba(255,255,255,0.9)">${d.tourName}</p>
  </td></tr>

  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:32px">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFF3ED"
           style="background-color:#FFF3ED;border:1px solid #FDB97B;border-radius:10px;margin-bottom:24px">
      <tr><td style="padding:20px 24px;text-align:center">
        <p style="margin:0 0 8px;font-size:13px;color:#888888">Precio especial por persona</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td style="font-size:18px;color:#bbbbbb;text-decoration:line-through;padding-right:12px;vertical-align:middle">$${d.priceAdult} USD</td>
            <td style="font-size:34px;font-weight:900;color:#1d70b7;vertical-align:middle">$${d.priceAdultOffer} <span style="font-size:14px;font-weight:400;color:#888888">USD</span></td>
          </tr>
        </table>
        <p style="margin:8px 0 0;font-size:12px;color:#c94d14;font-weight:700">Ahorras $${savings} por persona</p>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFF7F4"
           style="background-color:#FFF7F4;border-left:3px solid #c94d14;border-radius:0 8px 8px 0;margin-bottom:24px">
      <tr><td style="padding:12px 16px">
        <p style="margin:0;font-size:13px;color:#666666">
          <strong style="color:#c94d14">Oferta válida hasta:</strong>
          <span style="text-transform:capitalize"> ${endsLabel}</span>
        </p>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
      <tr><td align="center">
        <a href="https://dominicanatour.com/excursiones/${d.tourSlug}"
           style="display:inline-block;background-color:#1d70b7;color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
          Ver oferta y reservar →
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:12px;color:#bbbbbb;text-align:center">
      ¿No deseas recibir estas alertas?
      <a href="https://dominicanatour.com/cuenta" style="color:#bbbbbb;text-decoration:underline">Desuscribirse</a>
    </p>

  </td></tr>

  <tr><td bgcolor="#F5F5F5" style="background-color:#F5F5F5;padding:16px 32px;text-align:center;border-top:1px solid #E8E8E8;border-radius:0 0 12px 12px">
    <p style="margin:0;font-size:11px;color:#aaaaaa;line-height:1.7">
      © 2026 Dominicana Tour · República Dominicana<br>
      <a href="https://dominicanatour.com/privacidad" style="color:#bbbbbb;text-decoration:none">Privacidad</a>
      &nbsp;·&nbsp;
      <a href="https://dominicanatour.com/terminos" style="color:#bbbbbb;text-decoration:none">Términos</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
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
