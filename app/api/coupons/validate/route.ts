import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { code, amount } = await req.json()
    if (!code?.trim()) return NextResponse.json({ valid: false, error: 'Ingresa un código' })

    const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (!coupon || !coupon.active)
      return NextResponse.json({ valid: false, error: 'Código no válido' })
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return NextResponse.json({ valid: false, error: 'Cupón expirado' })
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      return NextResponse.json({ valid: false, error: 'Cupón agotado' })
    if (coupon.minAmount && Number(amount) < Number(coupon.minAmount))
      return NextResponse.json({ valid: false, error: `Mínimo de compra: $${Number(coupon.minAmount).toFixed(0)} USD` })

    const rawDiscount = coupon.discountType === 'PERCENT'
      ? Number(amount) * Number(coupon.discountValue) / 100
      : Math.min(Number(coupon.discountValue), Number(amount))
    const discountAmount = Math.round(rawDiscount * 100) / 100

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discountAmount,
      },
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Error al validar' })
  }
}
