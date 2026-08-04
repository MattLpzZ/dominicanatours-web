import { MetadataRoute } from 'next'

const BASE_URL = 'https://dominicanatour.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/cuenta/',
          '/mis-reservas/',
          '/reserva/',
          '/_next/',
          '/en/cuenta/',
          '/en/mis-reservas/',
          '/en/reserva/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
