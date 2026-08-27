export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'Token y contraseña requeridos (mínimo 8 caracteres)' },
        { status: 400 }
      )
    }

    const reset = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Enlace inválido o expirado. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    const hashed = await hash(password, 12)
    await prisma.user.update({
      where: { email: reset.email },
      data:  { password: hashed },
    })

    await prisma.passwordResetToken.delete({ where: { token } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reset-password error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
