import { PrismaClient, Difficulty } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

async function main() {
  const categories = await Promise.all([
    db.category.upsert({ where: { slug: 'playa-mar' }, update: {}, create: { name: 'Playa y Mar', slug: 'playa-mar', icon: '🏖️' } }),
    db.category.upsert({ where: { slug: 'aventura-natural' }, update: {}, create: { name: 'Aventura Natural', slug: 'aventura-natural', icon: '🏞️' } }),
    db.category.upsert({ where: { slug: 'cultural' }, update: {}, create: { name: 'Cultural e Histórico', slug: 'cultural', icon: '🏛️' } }),
    db.category.upsert({ where: { slug: 'fauna-naturaleza' }, update: {}, create: { name: 'Fauna y Naturaleza', slug: 'fauna-naturaleza', icon: '🐋' } }),
    db.category.upsert({ where: { slug: 'nocturno' }, update: {}, create: { name: 'Nocturno', slug: 'nocturno', icon: '🎶' } }),
  ])

  const tours = [
    { slug: 'cano-frio-cascadas', name: 'Caño Frío — Cascadas y Río', subtitle: 'Pozas naturales y cascadas escondidas en Samaná', description: 'Descubre uno de los secretos mejor guardados de Samaná: Caño Frío, un paraíso de cascadas y pozas de aguas cristalinas escondido entre manglares y selva tropical.', priceAdult: 89, priceChild: 55, duration: '8 horas', difficulty: Difficulty.MODERATE, categorySlug: 'aventura-natural', maxPeople: 15, minAge: 8, departureZone: 'Samaná', departureTime: '06:30 AM', languages: 'ES,EN,FR', featured: true, images: [{ url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1400&q=85', alt: 'Cascadas Caño Frío', order: 0 }] },
    { slug: 'isla-saona-catamaran', name: 'Isla Saona en Catamarán', subtitle: 'Playa de ensueño, piscina natural y buffet dominicano', description: 'Un día completo en la isla más soñada del Parque Nacional del Este. Piscina natural, buffet dominicano y atardecer inolvidable.', priceAdult: 120, priceChild: 75, duration: 'Día completo', difficulty: Difficulty.EASY, categorySlug: 'playa-mar', maxPeople: 30, minAge: 0, departureZone: 'La Romana', departureTime: '08:00 AM', languages: 'ES,EN', featured: true, images: [{ url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85', alt: 'Isla Saona', order: 0 }] },
    { slug: 'ballenas-jorobadas-samana', name: 'Avistamiento de Ballenas Jorobadas', subtitle: 'El espectáculo natural más impresionante del Caribe', description: 'Cada año, miles de ballenas migran a la Bahía de Samaná. Un espectáculo de la naturaleza que muy pocos tienen el privilegio de vivir.', priceAdult: 75, priceChild: 45, duration: '6 horas', difficulty: Difficulty.EASY, categorySlug: 'fauna-naturaleza', maxPeople: 20, minAge: 0, departureZone: 'Samaná', departureTime: '08:00 AM', languages: 'ES,EN,FR', featured: true, images: [{ url: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=1400&q=85', alt: 'Ballenas jorobadas', order: 0 }] },
    { slug: 'harley-tour-ciudad-colonial', name: 'Harley Tour — Ciudad Colonial SD', subtitle: 'Recorre el primer asentamiento europeo del continente', description: 'Recorre el primer asentamiento europeo del continente americano en Harley Davidson con guía experto.', priceAdult: 55, priceChild: 35, duration: '4 horas', difficulty: Difficulty.EASY, categorySlug: 'cultural', maxPeople: 10, minAge: 16, departureZone: 'Santo Domingo', departureTime: '09:00 AM', languages: 'ES,EN', featured: false, images: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=85', alt: 'Harley Tour', order: 0 }] },
    { slug: '27-charcos-damajagua', name: '27 Charcos de Damajagua', subtitle: 'Adrenalina pura en pozas naturales de montaña', description: 'Baja saltando entre pozas naturales en las montañas del norte. Adrenalina pura en estado natural.', priceAdult: 95, priceChild: 60, duration: '7 horas', difficulty: Difficulty.ADVANCED, categorySlug: 'aventura-natural', maxPeople: 12, minAge: 10, departureZone: 'Puerto Plata', departureTime: '07:00 AM', languages: 'ES,EN', featured: false, images: [{ url: 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&w=1400&q=85', alt: '27 Charcos', order: 0 }] },
    { slug: 'snorkel-playa-punta-cana', name: 'Snorkel y Playa — Punta Cana', subtitle: 'Arrecifes de coral en las aguas más turquesas del Caribe', description: 'Explora arrecifes de coral y vida marina en las aguas más turquesas del Caribe.', priceAdult: 65, priceChild: 40, duration: '5 horas', difficulty: Difficulty.EASY, categorySlug: 'playa-mar', maxPeople: 20, minAge: 5, departureZone: 'Punta Cana', departureTime: '09:00 AM', languages: 'ES,EN', featured: false, images: [{ url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85', alt: 'Snorkel Punta Cana', order: 0 }] },
    { slug: 'lago-enriquillo-cocodrilos', name: 'Lago Enriquillo — Cocodrilos e Iguanas', subtitle: 'El lago salado más grande del Caribe', description: 'El lago salado más grande del Caribe, hogar de cocodrilos americanos e iguanas de roca.', priceAdult: 80, priceChild: 50, duration: 'Día completo', difficulty: Difficulty.MODERATE, categorySlug: 'fauna-naturaleza', maxPeople: 15, minAge: 6, departureZone: 'Barahona', departureTime: '07:00 AM', languages: 'ES,EN', featured: false, images: [{ url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1400&q=85', alt: 'Lago Enriquillo', order: 0 }] },
    { slug: 'tour-cafe-cacao-ron', name: 'Tour Café, Cacao y Ron Artesanal', subtitle: 'Sabores auténticos del campo dominicano', description: 'Visita fincas, aprende el proceso del cacao y el café, y degusta ron artesanal dominicano.', priceAdult: 45, priceChild: 25, duration: '4 horas', difficulty: Difficulty.EASY, categorySlug: 'cultural', maxPeople: 20, minAge: 0, departureZone: 'Jarabacoa', departureTime: '09:00 AM', languages: 'ES,EN,FR', featured: false, images: [{ url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=85', alt: 'Tour Café y Cacao', order: 0 }] },
    { slug: 'pico-duarte-trekking', name: 'Pico Duarte — Trekking 2 días', subtitle: 'El pico más alto del Caribe: 3,175 msnm', description: 'Conquista los 3,175 msnm del pico más alto del Caribe. Expedición con camping incluido.', priceAdult: 180, priceChild: 120, duration: '2 días', difficulty: Difficulty.ADVANCED, categorySlug: 'aventura-natural', maxPeople: 8, minAge: 14, departureZone: 'Constanza', departureTime: '05:00 AM', languages: 'ES,EN', featured: false, images: [{ url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=85', alt: 'Pico Duarte', order: 0 }] },
  ]

  for (const t of tours) {
    const cat = categories.find(c => c.slug === t.categorySlug)!
    await db.tour.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        slug: t.slug, name: t.name, subtitle: t.subtitle, description: t.description,
        priceAdult: t.priceAdult, priceChild: t.priceChild, duration: t.duration,
        difficulty: t.difficulty, categoryId: cat.id, maxPeople: t.maxPeople,
        minAge: t.minAge, departureZone: t.departureZone, departureTime: t.departureTime,
        languages: t.languages, featured: t.featured, active: true,
        images: { create: t.images },
      },
    })
  }

  await db.user.upsert({
    where: { email: 'admin@dominicanatour.com' },
    update: {},
    create: {
      name: 'Admin', email: 'admin@dominicanatour.com',
      password: await bcrypt.hash('admin123', 12), role: 'ADMIN',
    },
  })

  console.log('Seed complete: 5 categories, 9 tours, 1 admin user')
}

main().catch(console.error).finally(() => db.$disconnect())
