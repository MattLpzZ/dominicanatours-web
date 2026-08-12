export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  const image = await prisma.accommodationImage.create({
    data: {
      accommodationId: parseInt(id),
      url: b.url, alt: b.alt ?? null,
      sortOrder: b.sortOrder ?? 0,
    },
  })
  return NextResponse.json({ ok: true, image }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params: _ }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const imageId = parseInt(new URL(req.url).searchParams.get('imageId') ?? '0')
  await prisma.accommodationImage.delete({ where: { id: imageId } })
  return NextResponse.json({ ok: true })
}
