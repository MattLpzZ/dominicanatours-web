export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const fd = await req.formData()
    const file = fd.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Tipo no permitido' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`
    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), buf)

    return NextResponse.json({ url: `/uploads/${name}` })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error al subir' }, { status: 500 })
  }
}
