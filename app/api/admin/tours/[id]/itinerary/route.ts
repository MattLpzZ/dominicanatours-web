export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  const item = await prisma.itineraryItem.create({
    data: { tourId: parseInt(id), time: b.time ?? '', title: b.title ?? '', description: b.description ?? '', order: b.order ?? 0 },
  })
  return NextResponse.json({ ok: true, item }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params: _ }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const itemId = parseInt(new URL(req.url).searchParams.get('itemId') ?? '0')
  await prisma.itineraryItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
