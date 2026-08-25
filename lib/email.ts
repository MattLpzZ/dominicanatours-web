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

function html(d: BookingEmailData): string {
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

  const row = (label: string, value: string, accent = false) =>
    `<tr style="border-top:1px solid #E8E8E8">
      <td style="padding:8px 0;color:#888;font-size:14px;width:38%">${label}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:${accent ? 700 : 500};color:${accent ? '#1d70b7' : '#111'}">${value}</td>
    </tr>`

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:540px;margin:32px auto 48px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">

    <div style="background:#111;padding:24px 32px;display:flex;align-items:center;gap:8px">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px">Dominicana</span>
      <span style="font-size:20px;font-weight:900;color:#1d70b7;letter-spacing:-0.5px">Tour</span>
    </div>

    <div style="background:linear-gradient(135deg,#1d70b7,#c94d14);padding:32px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.1em">Reserva recibida ✓</p>
      <p style="margin:0;font-size:26px;font-weight:900;color:#fff;line-height:1.15">¡Gracias, ${d.firstName}!</p>
    </div>

    <div style="padding:32px">
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.65">
        Tu solicitud fue recibida exitosamente. Te confirmaremos por este correo
        y WhatsApp en <strong style="color:#111">menos de 2 horas</strong>.
      </p>

      <div style="background:#FAFAFA;border:1px solid #E8E8E8;border-radius:12px;padding:20px 24px;margin-bottom:28px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.1em">Tu reserva</p>
        <table style="width:100%;border-collapse:collapse">
          ${row('Código', `<span style="font-family:monospace;background:#FFF3ED;color:#1d70b7;padding:2px 8px;border-radius:4px">${d.code}</span>`, true)}
          ${row('Tour', d.tourName)}
          ${row('Fecha', `<span style="text-transform:capitalize">${fecha}</span>`)}
          ${row('Personas', pax)}
          ${row('Total', `$${d.totalAmount} USD`, true)}
          ${row('Anticipo hoy', `$${d.depositAmount} USD (30%)`)}
          ${row('Método de pago', METHOD[d.paymentMethod] ?? d.paymentMethod)}
        </table>
      </div>

      <div style="text-align:center;margin-bottom:28px">
        <a href="https://dominicanatour.com/reserva/${d.code}"
           style="display:inline-block;background:#1d70b7;color:#fff;font-weight:700;
                  font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:.01em">
          Ver estado de mi reserva →
        </a>
      </div>

      <div style="background:#FFF7F4;border-left:3px solid #1d70b7;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1d70b7">Próximos pasos</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#666;line-height:1.8">
          <li>Confirmación en menos de 2 horas</li>
          <li>Te contactamos para coordinar el recogido desde tu hotel</li>
          <li>El saldo restante se paga el día del tour</li>
          <li>Cancelación gratuita hasta 48h antes</li>
        </ul>
      </div>

      <p style="margin:0;font-size:13px;color:#999;line-height:1.6">
        ¿Preguntas? Escríbenos por
        <a href="https://wa.me/18095550100" style="color:#1d70b7;text-decoration:none">WhatsApp</a>
        o a <a href="mailto:info@dominicanatour.com" style="color:#1d70b7;text-decoration:none">info@dominicanatour.com</a>
      </p>
    </div>

    <div style="background:#F5F5F5;padding:16px 32px;text-align:center;border-top:1px solid #E8E8E8">
      <p style="margin:0;font-size:11px;color:#aaa">
        © 2026 Dominicana Tour · República Dominicana<br>
        <a href="https://dominicanatour.com/privacidad" style="color:#bbb;text-decoration:none">Privacidad</a>
        &nbsp;·&nbsp;
        <a href="https://dominicanatour.com/terminos" style="color:#bbb;text-decoration:none">Términos</a>
      </p>
    </div>
  </div>
  </body></html>`
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  await getTransport().sendMail({
    from:    FROM,
    to:      data.email,
    subject: `Reserva recibida: ${data.tourName} · ${data.code}`,
    html:    html(data),
  })
}

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

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:540px;margin:32px auto 48px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07)">

    <div style="background:#111;padding:24px 32px">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px">Dominicana</span>
      <span style="font-size:20px;font-weight:900;color:#1d70b7;letter-spacing:-0.5px">Tour</span>
    </div>

    <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.1em">Reserva confirmada ✓</p>
      <p style="margin:0;font-size:26px;font-weight:900;color:#fff;line-height:1.15">¡${d.firstName}, tu reserva está confirmada!</p>
    </div>

    <div style="padding:32px">
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.65">
        Hemos confirmado tu reserva. Te esperamos para vivir una experiencia increíble.
      </p>

      <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;padding:20px 24px;margin-bottom:28px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#888;font-size:14px;width:38%">Código</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#1d70b7">
              <span style="font-family:monospace;background:#FFF3ED;color:#1d70b7;padding:2px 8px;border-radius:4px">${d.code}</span>
            </td>
          </tr>
          <tr style="border-top:1px solid #BBF7D0">
            <td style="padding:8px 0;color:#888;font-size:14px">Tour</td>
            <td style="padding:8px 0;font-size:14px;font-weight:500;color:#111">${d.tourName}</td>
          </tr>
          <tr style="border-top:1px solid #BBF7D0">
            <td style="padding:8px 0;color:#888;font-size:14px">Fecha</td>
            <td style="padding:8px 0;font-size:14px;color:#111;text-transform:capitalize">${fecha}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-bottom:28px">
        <a href="https://dominicanatour.com/reserva/${d.code}"
           style="display:inline-block;background:#1d70b7;color:#fff;font-weight:700;
                  font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
          Ver mi reserva →
        </a>
      </div>

      <div style="background:#FFF7F4;border-left:3px solid #1d70b7;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1d70b7">Próximos pasos</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#666;line-height:1.8">
          <li>Te contactaremos para coordinar el punto de recogida desde tu hotel</li>
          <li>El saldo restante se paga el día del tour</li>
          <li>Cancelación gratuita hasta 48h antes</li>
        </ul>
      </div>

      <p style="margin:0;font-size:13px;color:#999;line-height:1.6">
        ¿Preguntas? Escríbenos por
        <a href="https://wa.me/18095550100" style="color:#1d70b7;text-decoration:none">WhatsApp</a>
      </p>
    </div>

    <div style="background:#F5F5F5;padding:16px 32px;text-align:center;border-top:1px solid #E8E8E8">
      <p style="margin:0;font-size:11px;color:#aaa">© 2026 Dominicana Tour · República Dominicana</p>
    </div>
  </div></body></html>`
}

export async function sendBookingConfirmed(data: StatusEmailData): Promise<void> {
  await getTransport().sendMail({
    from:    FROM,
    to:      data.email,
    subject: `¡Reserva confirmada! ${data.tourName} · ${data.code}`,
    html:    confirmedHtml(data),
  })
}