import { NavbarServer } from '@/components/layout/NavbarServer'
import { Footer } from '@/components/layout/Footer'
import { ConditionalFooter } from '@/components/layout/ConditionalFooter'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { AnimatedMain } from '@/components/ui/AnimatedMain'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { GaConsentRestorer } from '@/components/analytics/GaConsentRestorer'
import { NoiseCanvas } from '@/components/layout/NoiseCanvas'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NoiseCanvas />
      <NavbarServer />
      <AnimatedMain>{children}</AnimatedMain>
      <ConditionalFooter><Footer /></ConditionalFooter>
      <ChatWidget />
      <ScrollReveal />
      <CookieBanner />
      <GaConsentRestorer />
    </>
  )
}
