'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  toursCount: number
}

const STATS: [string, string][] = [
  ['4,800+', 'Turistas felices'],
  ['20+', 'Excursiones'],
  ['4.9 ★', 'Rating'],
  ['8 años', 'Experiencia'],
]

const BOKEH = [
  { size: 96, top: '14%', left: '7%',  opacity: 0.20, color: 'bg-accent',   delay: '0s',   dur: '12s' },
  { size: 48, top: '62%', left: '4%',  opacity: 0.15, color: 'bg-white',    delay: '1.2s', dur: '5s'  },
  { size: 72, top: '28%', right: '9%', opacity: 0.18, color: 'bg-accent-2', delay: '3s',   dur: '9s'  },
  { size: 32, top: '72%', right: '14%',opacity: 0.25, color: 'bg-gold',     delay: '0.5s', dur: '7s'  },
  { size: 20, top: '18%', left: '48%', opacity: 0.20, color: 'bg-white',    delay: '2s',   dur: '5s'  },
  { size: 60, top: '52%', left: '22%', opacity: 0.14, color: 'bg-accent-2', delay: '5s',   dur: '14s' },
  { size: 16, top: '40%', right: '30%',opacity: 0.20, color: 'bg-gold',     delay: '1.5s', dur: '6s'  },
]

export function ParallaxHero({ toursCount }: Props) {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      if (layerRef.current) {
        layerRef.current.style.transform = `translateY(${window.scrollY * 0.38}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax image layer — scaled up so translateY doesn't reveal edges */}
      <div ref={layerRef} className="absolute inset-0 scale-[1.35] will-change-transform">
        <Image
          src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1920&q=90"
          alt="República Dominicana"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-dt-dark/75 via-dt-dark/50 to-dt-dark/85 z-10" />

      {/* Bokeh circles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {BOKEH.map((b, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-xl ${b.color} ${i % 2 === 0 ? 'animate-drift' : (i % 3 === 0 ? 'animate-float-d' : 'animate-float')}`}
            style={{
              width: b.size,
              height: b.size,
              top: b.top,
              left: 'left' in b ? b.left : undefined,
              right: 'right' in b ? (b as {right: string}).right : undefined,
              opacity: b.opacity,
              animationDelay: b.delay,
              animationDuration: b.dur,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-24 text-center">
        <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-2 animate-pulse" />
            Operadora turística oficial · República Dominicana
          </span>
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white leading-[0.95] mb-6 animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          Descubre la isla<br />
          más{' '}
          <em className="not-italic text-accent">vibrante</em>
          <br />del Caribe
        </h1>

        <p
          className="text-white/70 text-lg md:text-xl max-w-xl mx-auto mb-10 animate-fade-up"
          style={{ animationDelay: '0.28s' }}
        >
          {toursCount}+ excursiones auténticas con guías dominicanos certificados, grupos pequeños y transporte puerta a puerta.
        </p>

        <div
          className="flex flex-wrap justify-center gap-4 mb-16 animate-fade-up"
          style={{ animationDelay: '0.38s' }}
        >
          <Link
            href="/excursiones"
            className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 rounded-dt-sm transition-all duration-200 hover:scale-105 hover:shadow-dt-md text-lg"
          >
            Explorar excursiones
          </Link>
          <Link
            href="#categorias"
            className="border-2 border-white/40 hover:border-white bg-white/10 backdrop-blur hover:bg-white/20 text-white font-bold px-8 py-4 rounded-dt-sm transition-all duration-200 text-lg"
          >
            ¿Cómo funciona?
          </Link>
        </div>

        {/* Stats */}
        <div
          className="flex flex-wrap justify-center gap-10 sm:gap-16 animate-fade-up"
          style={{ animationDelay: '0.5s' }}
        >
          {STATS.map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-display font-bold text-white">{num}</div>
              <div className="text-white/50 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave transition */}
      <div className="absolute bottom-0 left-0 right-0 z-20 leading-none overflow-hidden">
        <svg
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          className="w-full fill-dt-bg"
          style={{ height: 72, display: 'block' }}
        >
          <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" />
        </svg>
      </div>
    </section>
  )
}
