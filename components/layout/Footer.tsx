import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { fetchApi } from '@/lib/api'
import { ManageCookiesBtn } from './ManageCookiesBtn'

const IG_D = 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
const FB_D = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
const WA_D = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

async function getSiteConfig(): Promise<Record<string,string>> {
  try {
    const rows = await (prisma as any).$queryRaw`SELECT \`key\`,\`value\` FROM site_configs WHERE \`key\` IN ('business_name','phone','whatsapp','instagram','facebook','tiktok','email','website','logo_url','icon_url','footer_desc')`
    const cfg: Record<string,string> = {}
    for (const r of (rows as any[])) cfg[r.key] = r.value
    return cfg
  } catch { return {} }
}

interface Destination { name: string; slug: string; tours_count: number }

export async function Footer() {
  const t = await getTranslations('footer')
  const cfg = await getSiteConfig()

  const companyName = cfg.business_name || 'Dominicana Tour'
  const phone       = cfg.phone || ''
  const waNumber    = (cfg.whatsapp || '').replace(/[^0-9]/g, '')
  const instagram   = cfg.instagram ? `https://instagram.com/${cfg.instagram}` : 'https://instagram.com/dominicanatour'
  const facebook    = cfg.facebook  ? `https://facebook.com/${cfg.facebook}`   : 'https://facebook.com/dominicanatour'
  const waLink      = waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/18095550100'

  const socialLinks = [
    { name: 'Instagram', href: instagram, d: IG_D },
    { name: 'Facebook',  href: facebook,  d: FB_D },
    { name: 'WhatsApp',  href: waLink,    d: WA_D },
  ]

  let categories: { name: string; slug: string }[] = []
  let destinations: Destination[] = []
  try {
    const [cats, destRes] = await Promise.all([
      prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } }),
      fetchApi<{ ok: boolean; destinations: Destination[] }>('/destinations', { next: { revalidate: 300 } }).catch(() => ({ ok: false, destinations: [] })),
    ])
    categories = cats
    destinations = (destRes.destinations ?? []).slice(0, 10)
  } catch {}

  return (
    <footer className="bg-dt-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <p className="font-display font-bold text-[18px] tracking-tight mb-3">
              {companyName.replace('Tour', '')}
              {companyName.includes('Tour') && <span className="text-accent">Tour</span>}
            </p>
            <p className="text-white/50 text-sm leading-relaxed mb-5 max-w-xs">
              {t('description')}
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map(s => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                  className="w-8 h-8 rounded-full bg-white/8 hover:bg-accent flex items-center justify-center transition-colors group">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white/55 group-hover:fill-white transition-colors">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
            {phone && (
              <p className="text-white/40 text-xs mt-3">{phone}</p>
            )}
          </div>

          {/* Explorar */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/35 mb-4">Explorar</h5>
            <ul className="space-y-2.5 text-sm text-white/55">
              <li><Link href="/excursiones" className="hover:text-white transition-colors">Todas las excursiones</Link></li>
              {categories.slice(0, 5).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/excursiones?cat=${cat.slug}`} className="hover:text-white transition-colors">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinos destacados */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/35 mb-4">Destinos destacados</h5>
            <ul className="space-y-2.5 text-sm text-white/55">
              {destinations.map(dest => (
                <li key={dest.slug}>
                  <Link href={`/destinos/${dest.slug}`} className="hover:text-white transition-colors">
                    {dest.name}
                    {dest.tours_count > 0 && (
                      <span className="ml-1.5 text-white/25 text-xs">({dest.tours_count})</span>
                    )}
                  </Link>
                </li>
              ))}
              {destinations.length === 0 && <li className="text-white/25 text-xs italic">Próximamente</li>}
            </ul>
            {destinations.length > 0 && (
              <Link href="/destinos" className="inline-block mt-3 text-xs text-white/35 hover:text-white/70 transition-colors">
                Ver todos →
              </Link>
            )}
          </div>

          {/* Compañía */}
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/35 mb-4">Compañía</h5>
            <ul className="space-y-2.5 text-sm text-white/55 mb-6">
              <li><Link href="/nosotros" className="hover:text-white transition-colors">Nosotros</Link></li>
              <li><Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link></li>
              <li><Link href="/mis-reservas" className="hover:text-white transition-colors">Consultar reserva</Link></li>
              <li><Link href="/cuenta" className="hover:text-white transition-colors">Mi cuenta</Link></li>
              <li>
                <a href="mailto:info@dominicanatour.com" className="hover:text-white transition-colors">
                  info@dominicanatour.com
                </a>
              </li>
            </ul>
            <a href="https://wa.me/18095550100" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ea855] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('whatsappCta')}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/30">
          <p>{t('copyrightText', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-4">
            <Link href="/terminos" className="hover:text-white/60">{t('terminos')}</Link>
            <Link href="/privacidad" className="hover:text-white/60">{t('privacidad')}</Link>
            <ManageCookiesBtn />
            <a href="https://soymattlpzz.com" target="_blank" rel="noopener noreferrer"
              className="text-white/20 hover:text-white/50 transition-colors">
              Hecho por <span className="font-semibold">soymattlpzz</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
