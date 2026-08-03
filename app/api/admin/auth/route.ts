export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken, setAdminCookie, clearAdminCookie } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }
    const valid = await compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }
    const token = createToken(user.id, user.email)
    await setAdminCookie(token)
    return NextResponse.json({ ok: true, name: user.name })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  await clearAdminCookie()
  return NextResponse.json({ ok: true })
}
