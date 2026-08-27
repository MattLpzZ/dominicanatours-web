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

// ── Shared shell ──────────────────────────────────────────────────────────────
function shell(heroColor: string, heroHtml: string, bodyHtml: string, footerExtra = ''): string {
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

  <tr><td bgcolor="${heroColor}" style="background-color:${heroColor};padding:28px 32px">
    ${heroHtml}
  </td></tr>

  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:32px">
    ${bodyHtml}
  </td></tr>

  <tr><td bgcolor="#F5F5F5" style="background-color:#F5F5F5;padding:16px 32px;text-align:center;border-top:1px solid #E8E8E8;border-radius:0 0 12px 12px">
    ${footerExtra}
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

function detailRow(label: string, value: string, accent = false): string {
  return `<tr>
    <td style="padding:9px 0;color:#888888;font-size:14px;width:40%;border-top:1px solid #EEEEEE;vertical-align:top">${label}</td>
    <td style="padding:9px 0;font-size:14px;font-weight:${accent ? 700 : 500};color:${accent ? '#1d70b7' : '#111111'};border-top:1px solid #EEEEEE">${value}</td>
  </tr>`
}

function cta(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;background-color:#1d70b7;color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
        ${label}
      </a>
    </td></tr>
  </table>`
}

function nextSteps(items: string[]): string {
  const lis = items.map(i => `<li style="margin-bottom:4px">${i}</li>`).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFF7F4" style="background-color:#FFF7F4;border-left:3px solid #1d70b7;border-radius:0 8px 8px 0;margin-bottom:24px">
    <tr><td style="padding:14px 18px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1d70b7">Próximos pasos</p>
      <ul style="margin:0;padding-left:18px;font-size:13px;color:#666666;line-height:1.9">${lis}</ul>
    </td></tr>
  </table>`
}

// ── Booking Confirmation ──────────────────────────────────────────────────────
export interface BookingEmailData {
  code:          string
  firstName:     string
  lastName:      string | null
  email:         string
  tourName:      string
  tourDate:      string | null
  adults:        number
  children:      number
  totalAmount:   number
  depositAmount: number
  paymentMethod: string
}

function bookingHtml(d: BookingEmailData): string {
  const METHOD: Record<string, string> = {
    whatsapp: 'WhatsApp — coordinamos el pago contigo',
    card:     'Tarjeta de crédito / débito',
    paypal:   'PayPal',
  }
  const pax = d.children > 0
    ? `${d.adults} adulto${d.adults !== 1 ? 's' : ''} + ${d.children} niño${d.children !== 1 ? 's' : ''}`
    : `${d.adults} adulto${d.adults !== 1 ? 's' : ''}`
  const fecha = d.tourDate
    ? new Date(d.tourDate + 'T12:00:00').toLocaleDateString('es-DO',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Por confirmar'

  const hero = `
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.1em">Reserva recibida ✓</p>
    <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2">¡Gracias, ${d.firstName}!</p>`

  const code = `<span style="font-family:'Courier New',Courier,monospace;background-color:#E8F0FB;color:#1d70b7;padding:2px 8px;border-radius:4px">${d.code}</span>`

  const body = `
    <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.65">
      Tu solicitud fue recibida exitosamente. Te confirmaremos por este correo y WhatsApp en
      <strong style="color:#111111">menos de 2 horas</strong>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAFAFA"
           style="background-color:#FAFAFA;border:1px solid #E8E8E8;border-radius:10px;margin-bottom:28px">
      <tr><td style="padding:16px 20px 8px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#aaaaaa;text-transform:uppercase;letter-spacing:0.1em">Tu reserva</p>
      </td></tr>
      <tr><td style="padding:0 20px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${detailRow('Código', code, true)}
          ${detailRow('Tour', d.tourName)}
          ${detailRow('Fecha', `<span style="text-transform:capitalize">${fecha}</span>`)}
          ${detailRow('Personas', pax)}
          ${detailRow('Total', `$${d.totalAmount} USD`, true)}
          ${detailRow('Anticipo hoy', `$${d.depositAmount} USD`)}
          ${detailRow('Método de pago', METHOD[d.paymentMethod] ?? d.paymentMethod)}
        </table>
      </td></tr>
    </table>

    ${cta(`https://dominicanatour.com/reserva/${d.code}`, 'Ver estado de mi reserva →')}

    ${nextSteps([
      'Confirmación en menos de 2 horas',
      'Te contactamos para coordinar el recogido desde tu hotel',
      'El saldo restante se paga el día del tour',
      'Cancelación gratuita hasta 48h antes',
    ])}

    <p style="margin:0;font-size:13px;color:#999999;line-height:1.6">
      ¿Preguntas? Escríbenos por <a href="https://wa.me/18095550100" style="color:#1d70b7;text-decoration:none">WhatsApp</a>
      o a <a href="mailto:info@dominicanatour.com" style="color:#1d70b7;text-decoration:none">info@dominicanatour.com</a>
    </p>`

  return shell('#1d70b7', hero, body)
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  await getTransport().sendMail({
    from:    FROM,
    to:      data.email,
    subject: `Reserva recibida: ${data.tourName} · ${data.code}`,
    html:    bookingHtml(data),
  })
}

// ── Booking Confirmed ─────────────────────────────────────────────────────────
export interface StatusEmailData {
  code:      string
  firstName: string
  email:     string
  tourName:  string
  tourDate:  string | null
}

function confirmedHtml(d: StatusEmailData): string {
  const fecha = d.tourDate
    ? new Date(d.tourDate + 'T12:00:00').toLocaleDateString('es-DO',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Por confirmar'

  const hero = `
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.1em">Reserva confirmada ✓</p>
    <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2">¡${d.firstName}, tu reserva está confirmada!</p>`

  const code = `<span style="font-family:'Courier New',Courier,monospace;background-color:#D1FAE5;color:#059669;padding:2px 8px;border-radius:4px">${d.code}</span>`

  const body = `
    <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.65">
      Hemos confirmado tu reserva. Te esperamos para vivir una experiencia increíble en República Dominicana.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F0FDF4"
           style="background-color:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;margin-bottom:28px">
      <tr><td style="padding:16px 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${detailRow('Código', code)}
          ${detailRow('Tour', d.tourName)}
          ${detailRow('Fecha', `<span style="text-transform:capitalize">${fecha}</span>`)}
        </table>
      </td></tr>
    </table>

    ${cta(`https://dominicanatour.com/reserva/${d.code}`, 'Ver mi reserva →')}

    ${nextSteps([
      'Te contactaremos para coordinar el punto de recogida desde tu hotel',
      'El saldo restante se paga el día del tour',
      'Cancelación gratuita hasta 48h antes',
    ])}

    <p style="margin:0;font-size:13px;color:#999999;line-height:1.6">
      ¿Preguntas? Escríbenos por <a href="https://wa.me/18095550100" style="color:#1d70b7;text-decoration:none">WhatsApp</a>
    </p>`

  return shell('#16a34a', hero, body)
}

export async function sendBookingConfirmed(data: StatusEmailData): Promise<void> {
  await getTransport().sendMail({
    from:    FROM,
    to:      data.email,
    subject: `¡Reserva confirmada! ${data.tourName} · ${data.code}`,
    html:    confirmedHtml(data),
  })
}
