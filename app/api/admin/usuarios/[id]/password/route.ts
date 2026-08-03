import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { password } = await req.json()
  if (!password || password.length < 6)
    return NextResponse.json({ error: 'Contrase?a debe tener al menos 6 caracteres' }, { status: 400 })

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: parseInt(id) }, data: { password: hash } })

  return NextResponse.json({ ok: true })
}

