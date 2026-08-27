export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordReset } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ ok: true })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (user && user.role === 'ADMIN' && user.active) {
      // Remove any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email: user.email } })

      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.passwordResetToken.create({
        data: { email: user.email, token, expiresAt },
      })

      await sendPasswordReset({ email: user.email, name: user.name, token })
    }

    // Always return success — never reveal if the email exists
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ ok: true })
  }
}
