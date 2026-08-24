"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router   = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const [forgotMode, setForgotMode]   = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent]   = useState(false)
  const [forgotErr, setForgotErr]     = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotErr(''); setForgotLoading(true)
    try {
      const res = await fetch('https://dominicantour.leymaken.com/api/v3/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setForgotErr(d.error || 'Error'); }
      else setForgotSent(true)
    } catch { setForgotErr('Error de conexión') }
    finally { setForgotLoading(false) }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return }
      router.push('/admin')
      router.refresh()
    } catch { setError('Error de conexión') }
    finally  { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: '#000000',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(249,115,22,0.06) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: '#f97316',
            boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
            marginBottom: 12,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7z M12 11a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fafafa', margin: 0, lineHeight: 1.3 }}>
            Dominicana Tour
          </h1>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #262626',
          borderRadius: 12,
          padding: '2rem',
          boxShadow: '0 0 0 1px rgba(249,115,22,0.05), 0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: 0 }}>Iniciar sesión</p>
            <p style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>Panel de Administración</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <div style={{
                color: '#f87171', borderRadius: 6, fontSize: 12,
                padding: '8px 12px',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}>
                {error}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#a3a3a3', marginBottom: 4 }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus
                placeholder="admin@dominicanatour.com"
                style={{
                  width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6,
                  backgroundColor: '#171717', border: '1px solid #262626',
                  color: '#fafafa', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 1px #f97316' }}
                onBlur={e =>  { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#a3a3a3', marginBottom: 4 }}>
                Contraseña
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6,
                  backgroundColor: '#171717', border: '1px solid #262626',
                  color: '#fafafa', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 1px #f97316' }}
                onBlur={e =>  { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '9px', fontSize: 13, fontWeight: 600,
                borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: loading ? '#c2510e' : '#f97316',
                color: '#fff', marginTop: 4,
                transition: 'background-color 0.15s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
            {!forgotMode && (
              <button type="button" onClick={() => { setForgotMode(true); setError('') }}
                style={{ background: 'none', border: 'none', width: '100%', marginTop: 6,
                  fontSize: 11, color: '#737373', cursor: 'pointer', textDecoration: 'underline' }}>
                Olvidé mi contraseña
              </button>
            )}
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#525252', marginTop: 20 }}>
          © 2025 Dominicana Tour · Leymaken Platform
        </p>

        {/* Developer banner */}
        <div style={{
          marginTop: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #262626',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f97316', flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: '#525252', margin: 0 }}>
            Desarrollado por{' '}
            <a
              href="https://soymattlpzz.com"
              target="_blank" rel="noopener noreferrer"
              style={{ color: '#737373', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f97316')}
              onMouseLeave={e => (e.currentTarget.style.color = '#737373')}
            >
              soymattlpzz
            </a>
            {' '}· Leymaken Platform
          </p>
        </div>
      </div>
    </div>
  )
}
