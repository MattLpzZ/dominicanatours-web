import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Dominicana Tour — Operadora Turística Nacional'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #060D1A 0%, #0B1E3D 55%, #0d3455 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(232,93,32,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(232,93,32,0.06)' }} />
        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '3px', background: 'linear-gradient(90deg, #E85D20, #ff8c42, #E85D20)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: '20px' }}>
            República Dominicana · Excursiones Turísticas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '88px', fontWeight: 800, color: '#ffffff', lineHeight: '0.95', letterSpacing: '-0.02em' }}>
              Dominicana
            </div>
            <div style={{ fontSize: '88px', fontWeight: 800, color: '#E85D20', lineHeight: '0.95', letterSpacing: '-0.02em' }}>
              Tour
            </div>
          </div>
          <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.48)', textAlign: 'center', maxWidth: '580px', lineHeight: '1.5', marginBottom: '36px' }}>
            Guías locales certificados · Grupos pequeños · Puerta a puerta
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Playas', 'Aventura', 'Cultura', 'Naturaleza'].map((cat) => (
              <div key={cat} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '100px', padding: '8px 18px', fontSize: '13px', color: 'rgba(255,255,255,0.52)', fontWeight: 600 }}>
                {cat}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.05em' }}>
          dominicanatour.com
        </div>
      </div>
    ),
    { ...size }
  )
}
