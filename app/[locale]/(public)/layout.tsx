import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ConditionalFooter } from '@/components/layout/ConditionalFooter'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { AnimatedMain } from '@/components/ui/AnimatedMain'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { getSiteConfig, DEFAULT_ANNOUNCE } from '@/lib/site-config'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig()

  let announce: string[] = DEFAULT_ANNOUNCE
  try {
    if (config.announce_config) announce = JSON.parse(config.announce_config)
  } catch {}

  const icons = [
    'M5 13l4 4L19 7',
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  ]

  return (
    <>
      <div className="bg-[#111111] text-white/55 py-2.5 px-4 text-center text-[11px] font-medium">
        <div className="flex items-center justify-center gap-5 flex-wrap max-w-7xl mx-auto">
          {announce.map((item, i) => (
            <span key={i} className={['flex items-center gap-1.5', i > 0 ? 'hidden sm:flex' : ''].join(' ')}>
              {i > 0 && <span className="text-white/15 hidden sm:inline mr-4">·</span>}
              <svg className="w-3 h-3 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icons[i] ?? icons[0]} />
              </svg>
              <span className="text-white/85">{item}</span>
            </span>
          ))}
        </div>
      </div>
      <Navbar />
      <AnimatedMain>{children}</AnimatedMain>
      <ConditionalFooter><Footer /></ConditionalFooter>
      <ChatWidget />
      <ScrollReveal />
      <CookieBanner />
    </>
  )
}
