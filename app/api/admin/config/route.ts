export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

async function getAll() {
  const rows = await prisma.siteConfig.findMany()
  const obj: Record<string, string> = {}
  for (const r of rows) obj[r.key] = r.value
  return obj
}

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await getAll())
  } catch {
    return NextResponse.json({}, { status: 200 })
  }
}

export async function PUT(req: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json() as Record<string, string>
    const ALLOWED = [
      'business_name','wa_number','wa_message','contact_email','business_hours','deposit_pct',
      'hero_title','hero_subtitle','hero_cta','hero_cta_url','hero_bg_image',
      'featured_title','why_cta_title','why_cta_text',
      'accent_color',
      'banners_config','stats_config','announce_config','testimonials_config',
      'nosotros_hero_image',
    ]
    await Promise.all(
      ALLOWED
        .filter(k => body[k] !== undefined)
        .map(k =>
          prisma.siteConfig.upsert({
            where: { key: k },
            update: { value: String(body[k]) },
            create: { key: k, value: String(body[k]) },
          })
        )
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
