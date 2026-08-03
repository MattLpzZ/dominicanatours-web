import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ coupons })
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code, description, discountType, discountValue, minAmount, maxUses, expiresAt } = await req.json()
  if (!code || !discountType || discountValue === undefined)
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  const exists = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (exists) return NextResponse.json({ error: 'Código ya en uso' }, { status: 400 })
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(), description: description ?? null,
      discountType, discountValue: parseFloat(discountValue),
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxUses: maxUses ? parseInt(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })
  return NextResponse.json({ coupon }, { status: 201 })
}
