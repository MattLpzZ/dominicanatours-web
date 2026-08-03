export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  const data: Record<string, unknown> = {
    name:        b.name?.trim(),
    email:       b.email?.trim().toLowerCase(),
    role:        b.role,
    active:      b.active,
    permissions: b.permissions ? JSON.stringify(b.permissions) : null,
  }
  if (b.password?.trim() && b.password.length >= 6) {
    data.password = await bcrypt.hash(b.password, 10)
  }
  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data,
    select: { id: true, name: true, email: true, role: true, active: true, permissions: true, createdAt: true },
  })
  return NextResponse.json({ ok: true, user })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  // Prevent deleting self
  if (parseInt(id) === session.userId)
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
  await prisma.user.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}

