export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, permissions: true, createdAt: true },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json({ ok: true, users })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  if (!b.name?.trim() || !b.email?.trim() || !b.password?.trim())
    return NextResponse.json({ error: 'Nombre, email y contrase?a son requeridos' }, { status: 400 })
  if (b.password.length < 6)
    return NextResponse.json({ error: 'Contrase?a m?nimo 6 caracteres' }, { status: 400 })
  const exists = await prisma.user.findUnique({ where: { email: b.email.trim() } })
  if (exists) return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
  const hash = await bcrypt.hash(b.password, 10)
  const user = await prisma.user.create({
    data: {
      name:        b.name.trim(),
      email:       b.email.trim().toLowerCase(),
      password:    hash,
      role:        b.role ?? 'AGENT',
      active:      b.active !== false,
      permissions: b.permissions ? JSON.stringify(b.permissions) : null,
    },
    select: { id: true, name: true, email: true, role: true, active: true, permissions: true, createdAt: true },
  })
  return NextResponse.json({ ok: true, user }, { status: 201 })
}

