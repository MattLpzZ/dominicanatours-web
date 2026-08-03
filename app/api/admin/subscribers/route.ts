import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const total = await prisma.customer.count({ where: { subscribed: true } })
  return NextResponse.json({ total })
}

export async function PATCH(req: NextRequest) {
  const { email, subscribed } = await req.json()
  await prisma.customer.update({ where: { email }, data: { subscribed } })
  return NextResponse.json({ ok: true })
}
