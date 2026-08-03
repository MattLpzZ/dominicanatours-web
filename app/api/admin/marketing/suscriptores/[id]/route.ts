export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { subscribed } = await req.json()
  const customer = await prisma.customer.update({
    where: { id: parseInt(id) },
    data: { subscribed },
    select: { id: true, subscribed: true },
  })
  return NextResponse.json({ ok: true, customer })
}
