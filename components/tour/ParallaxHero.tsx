'use client'
import { useEffect, useRef } from 'react'

interface Props { src: string; alt: string }

export function ParallaxHero({ src, alt }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Disable on touch devices — parallax feels bad on mobile
    if (window.matchMedia('(hover: none)').matches) return

    function onScroll() {
      if (!el) return
      const rect = el.parentElement!.getBoundingClientRect()
      const ratio = -rect.top / window.innerHeight
      el.style.transform = `translateY(${ratio * 80}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: '-15% 0',
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        willChange: 'transform',
      }}
      role="img"
      aria-label={alt}
    />
  )
}
