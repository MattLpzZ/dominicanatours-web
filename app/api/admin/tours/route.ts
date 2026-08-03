export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error:'Unauthorized' },{ status:401 })
  const tours = await prisma.tour.findMany({
    include: { category:{ select:{ id:true, name:true } }, provider:{ select:{ id:true, name:true } }, _count:{ select:{ reservations:true, dates:true } } },
    orderBy: { createdAt:'desc' },
  })
  return NextResponse.json({ ok:true, tours })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error:'Unauthorized' },{ status:401 })
  const b = await req.json()
  if (!b.name || !b.subtitle || !b.description || !b.priceAdult || !b.difficulty || !b.categoryId)
    return NextResponse.json({ error:'Faltan campos requeridos' },{ status:400 })
  let slug = slugify(b.name)
  const exists = await prisma.tour.findUnique({ where:{ slug } })
  if (exists) slug = `${slug}-${Date.now()}`
  const tour = await prisma.tour.create({ data:{
    slug, name:b.name, subtitle:b.subtitle, description:b.description,
    priceAdult:parseFloat(b.priceAdult), priceChild:parseFloat(b.priceChild||'0'),
    duration:b.duration||'', difficulty:b.difficulty,
    categoryId:parseInt(b.categoryId), maxPeople:parseInt(b.maxPeople||'20'),
    minAge:parseInt(b.minAge||'0'), departureZone:b.departureZone||'',
    departureTime:b.departureTime||'', languages:b.languages||'Español',
    active:b.active!==false, featured:b.featured===true,
    ...(b.costPrice !== undefined && b.costPrice !== "" && { costPrice: parseFloat(b.costPrice) }),
    ...(b.providerId && { providerId: parseInt(String(b.providerId)) }),
  }})
  return NextResponse.json({ ok:true, tour },{ status:201 })
}