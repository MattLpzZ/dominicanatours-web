'use client'
import { useState, useMemo, useRef } from 'react'
import type { ApiProduct } from '@/components/catalog/ExcursionesClient'
import { PROVINCES, resolveProvince } from '@/lib/provinces'

const BLUES = ['#1B3F64','#20527F','#276799','#3280B2','#4398CB','#1D4A72','#236189','#2E799F']

interface Props {
  tours: ApiProduct[]
  selectedProvince: string | null
  onProvinceSelect: (name: string | null) => void
}

export default function ProvinciasMapa({ tours, selectedProvince, onProvinceSelect }: Props) {
  const [hoveredId, setHoveredId]             = useState<string | null>(null)
  const [pressedId, setPressedId]             = useState<string | null>(null)
  const [tooltip, setTooltip]                 = useState<{ x: number; y: number; name: string; count: number } | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const byProvince = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tours) {
      if (!t.departure_zone) continue
      const p = resolveProvince(t.departure_zone)
      if (p) m.set(p, (m.get(p) ?? 0) + 1)
    }
    return m
  }, [tours])

  const totalActive = byProvince.size

  const handleEnter = (id: string, name: string, count: number, e: React.MouseEvent<SVGPathElement>) => {
    setHoveredId(id)
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, name, count })
  }
  const handleMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
  }
  const handleLeave = () => { setHoveredId(null); setTooltip(null) }

  const handleProvinceSelect = (name: string | null) => {
    setBannerDismissed(true)
    onProvinceSelect(name)
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: 'var(--color-bg-2)' }}
    >
      <style>{`
        @keyframes bannerFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px) }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) }
        }
      `}</style>

      {/* Noise texture */}
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4, pointerEvents: 'none', zIndex: 0 }}>
        <filter id="pg-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pg-noise)" />
      </svg>

      {/* SVG choropleth map */}
      <div style={{ position: 'absolute', inset: '2rem 2rem 2rem 2rem', zIndex: 1, touchAction: 'manipulation' }}>
        <svg
          viewBox="310 0 530 330"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 4px 20px rgba(0,30,70,0.18))' }}
        >
          <defs>
            <filter id="sel-glow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#E85D20" floodOpacity="0.65" />
            </filter>
            <filter id="press-glow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#4398CB" floodOpacity="0.8" />
            </filter>
          </defs>

          {PROVINCES.map((p, idx) => {
            const count     = byProvince.get(p.name) ?? 0
            const isSel     = selectedProvince === p.name
            const isHov     = hoveredId === p.id
            const isPressed = pressedId === p.id
            const hasDat    = count > 0
            const fill      = isSel ? '#E85D20' : BLUES[idx % BLUES.length]
            return (
              <g key={p.id}>
                <path
                  d={p.d}
                  fill={fill}
                  fillOpacity={isSel ? 1 : isPressed ? 1 : isHov ? 0.88 : hasDat ? 0.82 : 0.55}
                  stroke="#ffffff"
                  strokeWidth={isSel ? 0 : 0.8}
                  filter={isSel ? 'url(#sel-glow)' : isPressed ? 'url(#press-glow)' : undefined}
                  style={{ cursor: 'pointer', transition: isPressed ? 'none' : 'fill-opacity 0.15s ease, fill 0.15s ease' }}
                  onMouseEnter={e => handleEnter(p.id, p.name, count, e)}
                  onMouseMove={handleMove}
                  onMouseLeave={handleLeave}
                  onTouchStart={() => { setPressedId(p.id); setBannerDismissed(true) }}
                  onTouchEnd={() => setTimeout(() => setPressedId(null), 250)}
                  onClick={() => handleProvinceSelect(isSel ? null : p.name)}
                />
              </g>
            )
          })}

          {/* Tour count badges */}
          {PROVINCES.map(p => {
            const count = byProvince.get(p.name) ?? 0
            if (!count) return null
            const isSel     = selectedProvince === p.name
            const isHov     = hoveredId === p.id
            const isPressed = pressedId === p.id
            return (
              <g key={`b-${p.id}`} pointerEvents="none">
                <circle cx={p.cx} cy={p.cy} r={11}
                  fill={isSel ? '#fff' : (isHov || isPressed) ? '#E85D20' : 'rgba(255,255,255,0.92)'}
                  style={{ transition: 'fill 0.15s' }} />
                <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central"
                  fontSize="7.5" fontWeight="900"
                  fill={isSel ? '#E85D20' : (isHov || isPressed) ? '#fff' : '#1B3F64'}
                  letterSpacing="-0.5"
                  style={{ transition: 'fill 0.15s' }}>
                  {count}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Info label top-left */}
      <div style={{ position: 'absolute', top: 18, left: 24, zIndex: 2, pointerEvents: 'none' }}>
        <p style={{ margin: 0, color: 'var(--color-text)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          República Dominicana
        </p>
        {totalActive > 0 && (
          <p style={{ margin: '3px 0 0', color: 'var(--color-text-3)', fontSize: 10 }}>
            {totalActive} {totalActive === 1 ? 'provincia' : 'provincias'} con tours
          </p>
        )}
      </div>

      {/* Top instruction banner */}
      {!bannerDismissed && totalActive > 0 && (
        <div style={{
          position: 'absolute', top: 16, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px 8px 16px', borderRadius: 999,
          background: 'rgba(20,38,60,0.92)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'bannerFadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
          whiteSpace: 'nowrap',
        }}>
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M10 2a2 2 0 00-2 2v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3A1 1 0 009 13v1a3 3 0 006 0v-5a2 2 0 00-4 0" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>
            Toca una provincia para ver tours
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            style={{
              marginLeft: 2, width: 20, height: 20, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)', flexShrink: 0,
            }}>
            <svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (() => {
        const cw = containerRef.current?.offsetWidth ?? 800
        return (
          <div style={{
            position: 'absolute', zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap',
            left: Math.min(tooltip.x + 12, cw - 160),
            top: Math.max(tooltip.y - 38, 8),
            background: '#1B3048',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '6px 13px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{tooltip.name}</span>
            {tooltip.count > 0 && (
              <span style={{ color: '#E85D20', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
                {tooltip.count} tour{tooltip.count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )
      })()}
    </div>
  )
}
