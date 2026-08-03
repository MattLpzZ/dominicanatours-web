import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import SessionProvider from './session-provider'
import { EditModeListener } from '@/components/EditModeListener'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Dominicana Tour — Operadora Turística Nacional', template: '%s | Dominicana Tour' },
  description: 'Somos la operadora turística líder en República Dominicana. Más de 20 excursiones auténticas con guías locales certificados.',
  openGraph: { siteName: 'Dominicana Tour', locale: 'es_DO', type: 'website' },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange={false}>
            <EditModeListener />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
