import nodemailer from 'nodemailer'

export function getTransport() {
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
