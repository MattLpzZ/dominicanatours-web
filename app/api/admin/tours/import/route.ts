export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const cols: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    cols.push(cur.trim())
    rows.push(cols)
  }
  return rows
}

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[?-?]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length < 2) return NextResponse.json({ error: 'Archivo vac?o o sin datos' }, { status: 400 })

  const [headerRow, ...dataRows] = rows
  const idx = (col: string) => headerRow.findIndex(h => h.toLowerCase().trim() === col.toLowerCase())

  const iName     = idx('name')
  const iSubtitle = idx('subtitle')
  const iDesc     = idx('description')
  const iCat      = idx('category')
  const iPriceA   = idx('priceAdult')
  const iPriceC   = idx('priceChild')
  const iCost     = idx('costPrice')
  const iDuration = idx('duration')
  const iDiff     = idx('difficulty')
  const iMax      = idx('maxPeople')
  const iMinAge   = idx('minAge')
  const iDepZone  = idx('departureZone')
  const iDepTime  = idx('departureTime')
  const iLangs    = idx('languages')
  const iActive   = idx('active')
  const iFeatured = idx('featured')

  if (iName === -1) return NextResponse.json({ error: 'Columna "name" no encontrada' }, { status: 400 })

  const categories = await prisma.category.findMany()
  let created = 0
  const errors: string[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const name = row[iName]?.trim()
    if (!name) continue

    try {
      const catName = row[iCat]?.trim() ?? ''
      let category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (!category && categories.length > 0) category = categories[0]
      if (!category) { errors.push(`Fila ${i + 2}: sin categor?a disponible`); continue }

      const priceAdult = parseFloat(row[iPriceA] ?? '0') || 0
      const priceChild = parseFloat(row[iPriceC] ?? '0') || 0
      const costPrice  = iCost >= 0 ? (parseFloat(row[iCost] ?? '') || null) : null
      const difficulty = (['EASY', 'MODERATE', 'ADVANCED'].includes((row[iDiff] ?? '').toUpperCase())
        ? (row[iDiff] ?? 'EASY').toUpperCase()
        : 'EASY') as 'EASY' | 'MODERATE' | 'ADVANCED'

      let slug = slugify(name)
      const exists = await prisma.tour.findFirst({ where: { slug } })
      if (exists) { errors.push(`Fila ${i + 2}: "${name}" ya existe`); continue }

      await prisma.tour.create({
        data: {
          slug,
          name,
          subtitle:     row[iSubtitle]?.trim() ?? '',
          description:  row[iDesc]?.trim() ?? '',
          priceAdult,
          priceChild,
          ...(costPrice !== null && { costPrice }),
          duration:     iDuration >= 0 ? (row[iDuration]?.trim() ?? '') : '',
          difficulty,
          categoryId:   category.id,
          maxPeople:    parseInt(row[iMax] ?? '20') || 20,
          minAge:       parseInt(row[iMinAge] ?? '0') || 0,
          departureZone: iDepZone >= 0 ? (row[iDepZone]?.trim() ?? '') : '',
          departureTime: iDepTime >= 0 ? (row[iDepTime]?.trim() ?? '8:00 AM') : '8:00 AM',
          languages:    iLangs >= 0 ? (row[iLangs]?.trim() ?? 'Espa?ol') : 'Espa?ol',
          active:       iActive >= 0 ? row[iActive]?.toLowerCase() !== 'false' : true,
          featured:     iFeatured >= 0 ? row[iFeatured]?.toLowerCase() === 'true' : false,
        },
      })
      created++
    } catch (e) {
      errors.push(`Fila ${i + 2}: ${e instanceof Error ? e.message : 'error desconocido'}`)
    }
  }

  return NextResponse.json({ ok: true, created, errors })
}

