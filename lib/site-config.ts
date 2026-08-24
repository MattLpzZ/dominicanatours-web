import { prisma } from './prisma'

export const DEFAULT_BANNERS = [
  { tag: 'Descuento grupal', title: 'VIAJAN 4 O MÁS', accent: '20% DESCUENTO', sub: 'Se aplica automáticamente al reservar. Sin código. Aplica a todos los tours.', btn_text: 'Ver excursiones', btn_url: '/excursiones' },
  { tag: 'Disponible ahora', title: 'Tour privado · Solo tu grupo', sub: 'Mismos destinos, guía dedicado. Para familias, parejas o empresas.', btn_text: 'Cotizar ahora', btn_url: '' },
]

export const DEFAULT_STATS = [
  { n: '50+',  label: 'excursiones únicas' },
  { n: '100%', label: 'guías certificados' },
  { n: '24/7', label: 'soporte en español' },
  { n: '5★',   label: 'primera reseña real' },
]

export const DEFAULT_ANNOUNCE = [
  'Traslados incluidos en todos los tours',
  'Grupos máx. 15 personas',
  'Cancelación gratuita hasta 48h antes',
]

export const DEFAULT_TESTIMONIALS: { name: string; origin: string; tour: string; text: string }[] = []

export const CONFIG_DEFAULTS: Record<string, string> = {
  business_name:       'Dominicana Tour',
  wa_number:           '18095550100',
  wa_message:          'Hola! Me interesa una excursion.',
  contact_email:       'info@dominicanatour.com',
  business_hours:      'Lun-Dom 8:00 AM - 8:00 PM',
  deposit_pct:         '20',
  hero_title:          'Vive la República Dominicana',
  hero_subtitle:       'Excursiones con guías locales certificados. Auténtico, seguro, inolvidable.',
  hero_cta:            'Reservar ahora',
  hero_cta_url:        '/excursiones',
  hero_bg_image:       '',
  featured_title:      'Experiencias imperdibles',
  why_cta_title:       'Tienes preguntas?',
  why_cta_text:        'Nuestros expertos diseñan la excursión perfecta para ti. Escríbenos por WhatsApp.',
  banners_config:      JSON.stringify(DEFAULT_BANNERS),
  stats_config:        JSON.stringify(DEFAULT_STATS),
  announce_config:     JSON.stringify(DEFAULT_ANNOUNCE),
  testimonials_config: JSON.stringify(DEFAULT_TESTIMONIALS),
  nosotros_hero_image: 'https://images.unsplash.com/photo-1548102245-c79dbcfa9f92?w=1600&q=80',
}

export async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteConfig.findMany()
    const config = { ...CONFIG_DEFAULTS }
    for (const r of rows) config[r.key] = r.value
    return config
  } catch {
    return { ...CONFIG_DEFAULTS }
  }
}
