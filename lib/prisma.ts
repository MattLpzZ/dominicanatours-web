import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

let _prisma: PrismaClient | undefined

function getClient(): PrismaClient {
  if (_prisma) return _prisma

  const raw = process.env.DATABASE_URL ?? ''
  const m = raw.match(/^mysql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/)
  if (!m) throw new Error('DATABASE_URL missing or invalid')
  const [, user, password, host, portStr, database] = m

  const adapter = new PrismaMariaDb({
    host,
    port: parseInt(portStr, 10),
    user,
    password,
    database,
    connectionLimit: 5,
    connectTimeout: 10000,
  })
  _prisma = new PrismaClient({ adapter })
  return _prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const db = getClient()
    const val = Reflect.get(db, prop)
    return typeof val === 'function' ? (val as Function).bind(db) : val
  },
})
