import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

const SECRET = process.env.AUTH_SECRET ?? 'fallback-secret'
const COOKIE = 'dt_admin_token'
const TTL    = 60 * 60 * 8 // 8 hours

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig  = createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verify(token: string): { userId: number; email: string } | null {
  try {
    const [data, sig] = token.split('.')
    const expected = createHmac('sha256', SECRET).update(data).digest('base64url')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (payload.exp < Date.now() / 1000) return null
    return payload
  } catch { return null }
}

export function createToken(userId: number, email: string): string {
  return sign({ userId, email, exp: Math.floor(Date.now() / 1000) + TTL })
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verify(token)
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TTL,
    path: '/',
  })
}

export async function clearAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}
