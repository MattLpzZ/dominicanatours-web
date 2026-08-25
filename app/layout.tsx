import type { Metadata } from 'next'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import Script from 'next/script'
import SessionProvider from './session-provider'
import { EditModeListener } from '@/components/EditModeListener'
import './globals.css'

const GA_ID = 'G-40LNPXX177'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const BASE_URL = 'https://dominicanatour.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Dominicana Tour — Operadora Turística #1 en República Dominicana',
    template: '%s | Dominicana Tour',
  },
  description:
    'Somos la operadora turística líder en República Dominicana. Excursiones auténticas con guías locales certificados, grupos pequeños y transporte puerta a puerta. Más de 20 destinos activos en todas las provincias.',
  keywords: [
    'tours República Dominicana',
    'excursiones RD',
    'operadora turística dominicana',
    'tours Punta Cana',
    'excursiones Santo Domingo',
    'tours Samaná',
    'turismo República Dominicana',
    'guías turísticos certificados RD',
    'Dominican Republic tours',
    'excursions Dominican Republic',
    'Punta Cana tours',
    'Santo Domingo tours',
    'Samana excursions',
    'certified local guides DR',
  ],
  authors: [{ name: 'Dominicana Tour', url: BASE_URL }],
  creator: 'Dominicana Tour',
  publisher: 'Dominicana Tour',
  openGraph: {
    type: 'website',
    locale: 'es_DO',
    url: BASE_URL,
    siteName: 'Dominicana Tour',
    title: 'Dominicana Tour — Operadora Turística #1 en República Dominicana',
    description:
      'Excursiones auténticas con guías locales certificados en las 32 provincias de República Dominicana. Grupos pequeños, transporte incluido y cancelación flexible.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Dominicana Tour — Tours y Excursiones en República Dominicana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dominicana Tour — Operadora Turística #1 en República Dominicana',
    description: 'Excursiones auténticas en las 32 provincias de República Dominicana con guías certificados.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'es': BASE_URL,
      'en': `${BASE_URL}/en`,
      'x-default': BASE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

function WebsiteLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': ['TravelAgency', 'LocalBusiness'],
              '@id': `${BASE_URL}/#organization`,
              name: 'Dominicana Tour',
              alternateName: 'Dominicana Tour RD',
              description:
                'Operadora turística líder en República Dominicana. Más de 20 excursiones auténticas en las 32 provincias con guías locales certificados.',
              url: BASE_URL,
              logo: `${BASE_URL}/logo.svg`,
              image: `${BASE_URL}/og-image.jpg`,
              priceRange: '$$',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'DO',
                addressLocality: 'Santo Domingo',
                addressRegion: 'Distrito Nacional',
              },
              areaServed: { '@type': 'Country', name: 'República Dominicana', sameAs: 'https://www.wikidata.org/wiki/Q786' },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                bestRating: '5',
                worstRating: '1',
                reviewCount: '820',
              },
              sameAs: [
                'https://www.instagram.com/dominicanatour',
                'https://www.facebook.com/dominicanatour',
              ],
            },
            {
              '@type': 'WebSite',
              '@id': `${BASE_URL}/#website`,
              url: BASE_URL,
              name: 'Dominicana Tour',
              publisher: { '@id': `${BASE_URL}/#organization` },
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/excursiones?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            },
          ],
        }),
      }}
    />
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${bricolage.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#1d70b7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#2583d4" media="(prefers-color-scheme: dark)" />
        <WebsiteLd />
        {/* GA Consent Mode v2 — must run before gtag.js loads */}
        <script dangerouslySetInnerHTML={{ __html:
          `window.dataLayer=window.dataLayer||[];` +
          `function gtag(){dataLayer.push(arguments)}` +
          `gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`
        }} />
      </head>
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange={false}>
            <EditModeListener />
            {children}
          </ThemeProvider>
        </SessionProvider>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga-config" strategy="afterInteractive">{`gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
      </body>
    </html>
  )
}
