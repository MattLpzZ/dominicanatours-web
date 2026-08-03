export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  const provider = await prisma.provider.update({
    where: { id: parseInt(id) },
    data: {
      name:          b.name?.trim(),
      phone:         b.phone?.trim() || null,
      email:         b.email?.trim() || null,
      contactPerson: b.contactPerson?.trim() || null,
      notes:         b.notes?.trim() || null,
      active:        b.active !== false,
    },
    include: { _count: { select: { tours: true } } },
  })
  return NextResponse.json({ ok: true, provider })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  // Detach tours before deleting
  await prisma.tour.updateMany({ where: { providerId: parseInt(id) }, data: { providerId: null } })
  await prisma.provider.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}

