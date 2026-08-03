export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const subscribers = await prisma.customer.findMany({
    select: { id: true, name: true, email: true, subscribed: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ ok: true, subscribers })
}
