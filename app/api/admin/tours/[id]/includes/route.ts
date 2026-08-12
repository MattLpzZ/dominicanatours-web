export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  const item = await prisma.tourInclude.create({
    data: { tourId: parseInt(id), text: b.text ?? '', included: b.included ?? true },
  })
  return NextResponse.json({ ok: true, item }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params: _ }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const itemId = parseInt(new URL(req.url).searchParams.get('itemId') ?? '0')
  await prisma.tourInclude.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
