import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FaqAccordion } from '@/components/ui/FaqAccordion'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nosotros' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function NosotrosPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nosotros' })

  const FAQS = [
    { question: t('faq1Q'), answer: t('faq1A') },
    { question: t('faq2Q'), answer: t('faq2A') },
    { question: t('faq3Q'), answer: t('faq3A') },
    { question: t('faq4Q'), answer: t('faq4A') },
    { question: t('faq5Q'), answer: t('faq5A') },
    { question: t('faq6Q'), answer: t('faq6A') },
    { question: t('faq7Q'), answer: t('faq7A') },
    { question: t('faq8Q'), answer: t('faq8A') },
    { question: t('faq9Q'), answer: t('faq9A') },
  ]

  return (
    <div className="bg-dt-bg min-h-screen overflow-x-hidden">

      {/* ── HERO FOTO ─────────────────────────────────── */}
      <div className="relative h-[55vh] sm:h-[65vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1548102245-c79dbcfa9f92?w=1600&q=80"
          alt={t('imgAlt')}
          fill className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dt-dark via-dt-dark/40 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-10 sm:pb-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-accent text-xs font-bold uppercase tracking-[0.2em] mb-3 animate-fade-up" style={{ animationDelay: '0s' }}>
              {t('eyebrow')}
            </p>
            <h1 className="font-display font-bold text-white text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight animate-fade-up" style={{ animationDelay: '0.08s' }}>
              Dominicana<br />Tour
            </h1>
          </div>
        </div>
      </div>

      {/* ── INTRO EDITORIAL ───────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10 md:gap-16 items-start">
          <div>
            <div className="inline-flex items-center gap-2 border border-accent/30 bg-accent/5 px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-accent text-xs font-bold uppercase tracking-widest">{t('badge')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['820+', t('statsTravelers')],
                ['20+',  t('statsTours')],
                ['4.9',  t('statsRating')],
                ['8',    t('statsYears')],
              ].map(([n, l]) => (
                <div key={l} className="bg-dt-surface border border-dt-border rounded-xl p-4">
                  <div className="font-display font-bold text-accent text-3xl leading-none mb-1">{n}</div>
                  <div className="text-dt-text-3 text-xs uppercase tracking-wide">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-dt-text text-xl sm:text-2xl font-light leading-relaxed mb-6">
              {t('introText1')}
            </p>
            <p className="text-dt-text-3 text-base leading-relaxed mb-6">
              {t('introText2')}
            </p>
            <div className="flex flex-wrap gap-2">
              {[t('tag1'), t('tag2'), t('tag3'), t('tag4')].map(tag => (
                <span key={tag} className="text-xs font-semibold text-dt-text-2 bg-dt-surface border border-dt-border px-3 py-1.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── COMO FUNCIONA — timeline editorial ────────── */}
      <div className="bg-dt-dark relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent hidden md:block" style={{ top: '55%' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/4 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-accent text-xs font-bold uppercase tracking-[0.2em] mb-3">{t('processEyebrow')}</p>
            <h2 className="font-display font-bold text-white text-4xl sm:text-5xl">
              {t('processTitle')}<br />
              <span className="text-white/35">{t('processSubtitle')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 relative">
            {[
              {
                num: '01',
                title: t('step1Title'),
                desc: t('step1Desc'),
                icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
              },
              {
                num: '02',
                title: t('step2Title'),
                desc: t('step2Desc'),
                icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
              },
              {
                num: '03',
                title: t('step3Title'),
                desc: t('step3Desc'),
                icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
              },
            ].map(({ num, title, desc, icon }, i) => (
              <div key={num} data-reveal data-delay={String(i + 1)} className="relative bg-white/4 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl p-8 transition-all duration-500 group overflow-hidden">
                <div className="absolute top-0 right-0 font-display font-bold text-[100px] leading-none text-white/[0.035] select-none pointer-events-none translate-x-4 -translate-y-2">
                  {num}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5 group-hover:bg-accent/15 group-hover:border-accent/35 transition-all">
                    <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d={icon} />
                    </svg>
                  </div>
                  <p className="text-accent/60 text-xs font-bold uppercase tracking-widest mb-2">{num}</p>
                  <h3 className="font-display font-bold text-white text-2xl mb-3 group-hover:text-accent transition-colors">{title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute -right-px top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center z-20">
                    <svg className="w-4 h-4 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-12">
          <div className="flex-1">
            <p className="text-accent text-xs font-bold uppercase tracking-[0.2em] mb-3">{t('faqEyebrow')}</p>
            <h2 className="font-display font-bold text-dt-text text-4xl sm:text-5xl leading-tight">
              {t('faqTitle')}
            </h2>
          </div>
          <p className="text-dt-text-3 text-sm sm:text-right sm:max-w-[220px]">{t('faqSubtitle')}</p>
        </div>
        <FaqAccordion faqs={FAQS} />
      </div>

    </div>
  )
}
