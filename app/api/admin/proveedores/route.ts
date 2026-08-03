export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const providers = await prisma.provider.findMany({
    include: { _count: { select: { tours: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ ok: true, providers })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json()
  if (!b.name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  const provider = await prisma.provider.create({
    data: {
      name: b.name.trim(),
      phone: b.phone?.trim() || null,
      email: b.email?.trim() || null,
      contactPerson: b.contactPerson?.trim() || null,
      notes: b.notes?.trim() || null,
      active: b.active !== false,
    },
    include: { _count: { select: { tours: true } } },
  })
  return NextResponse.json({ ok: true, provider }, { status: 201 })
}

