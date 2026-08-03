export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { CONFIG_DEFAULTS } from '@/lib/site-config'
import ConfigEditor from './config-editor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configuraci?n | Admin' }

async function getConfig(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteConfig.findMany()
    const config = { ...CONFIG_DEFAULTS }
    for (const r of rows) config[r.key] = r.value
    return config
  } catch {
    return { ...CONFIG_DEFAULTS }
  }
}

export default async function ConfiguracionPage() {
  const [config, users] = await Promise.all([
    getConfig(),
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, permissions: true }, orderBy: { id: 'asc' } }).catch(() => []),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-semibold text-xl text-dt-text">Configuraci?n</h1>
        <p className="text-[13px] text-dt-text-3 mt-0.5">
          Ajustes del sitio, usuarios y herramientas de datos.
        </p>
      </div>
      <ConfigEditor initial={config} users={users.map(u => ({ ...u, role: String(u.role), createdAt: u.createdAt.toISOString() }))} />
    </div>
  )
}
