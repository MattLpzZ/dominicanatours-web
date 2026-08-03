'use client'
import { useEffect, useRef, useState } from 'react'

function parseTarget(raw: string): { num: number; suffix: string } {
  const match = raw.match(/([\d,.]+)(.*)/)
  if (!match) return { num: 0, suffix: raw }
  return { num: parseFloat(match[1].replace(/,/g, '')), suffix: match[2].trim() }
}

function CountUp({ raw, duration = 1400 }: { raw: string; duration?: number }) {
  const { num, suffix } = parseTarget(raw)
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        obs.disconnect()
        const start = performance.now()
        const isDecimal = raw.includes('.')
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          const val = ease * num
          setDisplay(isDecimal ? val.toFixed(1) : Math.round(val).toLocaleString())
          if (p < 1) requestAnimationFrame(tick)
          else setDisplay(isDecimal ? num.toFixed(1) : num.toLocaleString())
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [num, duration, raw])

  return <span ref={ref}>{display}{suffix}</span>
}

interface Stat { n: string; label: string }

export function StatsSection({ stats }: { stats: Stat[] }) {
  return (
    <div className="border-y border-[#EBEBEB] py-10 px-4" data-reveal>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ n, label }, i) => (
            <div
              key={i}
              className="py-2 px-6 md:px-10 border-l border-[#EBEBEB] first:border-l-0 first:pl-0 text-center md:text-left"
            >
              <div className="font-display font-black text-accent text-4xl sm:text-[44px] leading-none tabular-nums">
                <CountUp raw={n} />
              </div>
              <div className="text-[#717171] text-[11px] uppercase tracking-widest mt-1.5 font-semibold">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
