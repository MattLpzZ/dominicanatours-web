"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AdminLoginInner() {
  const router   = useRouter()
  const params   = useSearchParams()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const [forgotMode, setForgotMode]   = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent]   = useState(false)
  const [forgotErr, setForgotErr]     = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const [resetToken, setResetToken]     = useState<string | null>(null)
  const [newPassword, setNewPassword]   = useState('')
  const [confirmPass, setConfirmPass]   = useState('')
  const [resetErr, setResetErr]         = useState('')
  const [resetOk, setResetOk]           = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    const t = params.get('token')
    if (t) setResetToken(t)
  }, [params])

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotErr(''); setForgotLoading(true)
    try {
      await fetch('/api/admin/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      setForgotSent(true)
    } catch { setForgotErr('Error de conexión') }
    finally { setForgotLoading(false) }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetErr('')
    if (newPassword.length < 8) { setResetErr('Mínimo 8 caracteres'); return }
    if (newPassword !== confirmPass) { setResetErr('Las contraseñas no coinciden'); return }
    setResetLoading(true)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })
      const d = await res.json()
      if (!res.ok) { setResetErr(d.error || 'Error'); return }
      setResetOk(true)
      setTimeout(() => { router.push('/admin/login') }, 2500)
    } catch { setResetErr('Error de conexión') }
    finally { setResetLoading(false) }
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

  const inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6,
    backgroundColor: '#171717', border: '1px solid #262626',
    color: '#fafafa', outline: 'none', boxSizing: 'border-box' as const,
  }

  const focusOn  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 1px #f97316' }
  const focusOff = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.boxShadow = 'none' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', backgroundColor: '#000000',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(249,115,22,0.06) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 12, backgroundColor: '#f97316',
            boxShadow: '0 4px 20px rgba(249,115,22,0.3)', marginBottom: 12,
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
          backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: 12,
          padding: '2rem', boxShadow: '0 0 0 1px rgba(249,115,22,0.05), 0 20px 40px rgba(0,0,0,0.5)',
        }}>

          {/* ── Reset password (token in URL) ── */}
          {resetToken && !resetOk && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: 0 }}>Nueva contraseña</p>
                <p style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>Panel de Administración</p>
              </div>
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resetErr && (
                  <div style={{ color: '#f87171', borderRadius: 6, fontSize: 12, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {resetErr}
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#a3a3a3', marginBottom: 4 }}>Nueva contraseña</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    required autoFocus minLength={8} placeholder="Mínimo 8 caracteres"
                    style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#a3a3a3', marginBottom: 4 }}>Confirmar contraseña</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    required minLength={8} placeholder="Repite la contraseña"
                    style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <button type="submit" disabled={resetLoading}
                  style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', cursor: resetLoading ? 'not-allowed' : 'pointer', backgroundColor: resetLoading ? '#c2510e' : '#f97316', color: '#fff', marginTop: 4, opacity: resetLoading ? 0.7 : 1 }}>
                  {resetLoading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}

          {/* ── Reset OK ── */}
          {resetToken && resetOk && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: '0 0 6px' }}>Contraseña actualizada</p>
              <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>Redirigiendo al login...</p>
            </div>
          )}

          {/* ── Forgot password (sent confirmation) ── */}
          {!resetToken && forgotMode && forgotSent && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: '0 0 6px' }}>Correo enviado</p>
              <p style={{ fontSize: 13, color: '#737373', margin: '0 0 20px', lineHeight: 1.5 }}>
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
              </p>
              <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail('') }}
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#f97316', cursor: 'pointer', textDecoration: 'underline' }}>
                Volver al login
              </button>
            </div>
          )}

          {/* ── Forgot password form ── */}
          {!resetToken && forgotMode && !forgotSent && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: 0 }}>Recuperar contraseña</p>
                <p style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>Te enviaremos un enlace por correo</p>
              </div>
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {forgotErr && (
                  <div style={{ color: '#f87171', borderRadius: 6, fontSize: 12, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {forgotErr}
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#a3a3a3', marginBottom: 4 }}>Tu correo de admin</label>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    required autoFocus placeholder="admin@dominicanatour.com"
                    style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <button type="submit" disabled={forgotLoading}
                  style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', cursor: forgotLoading ? 'not-allowed' : 'pointer', backgroundColor: forgotLoading ? '#c2510e' : '#f97316', color: '#fff', marginTop: 4, opacity: forgotLoading ? 0.7 : 1 }}>
                  {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
                <button type="button" onClick={() => setForgotMode(false)}
                  style={{ background: 'none', border: 'none', fontSize: 11, color: '#737373', cursor: 'pointer', textDecoration: 'underline' }}>
                  Volver al login
                </button>
              </form>
            </>
          )}

          {/* ── Main login form ── */}
          {!resetToken && !forgotMode && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: 0 }}>Iniciar sesión</p>
                <p style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>Panel de Administración</p>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {error && (
                  <div style={{ color: '#f87171', borderRadius: 6, fontSize: 12, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {error}
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#a3a3a3', marginBottom: 4 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus placeholder="admin@dominicanatour.com"
                    style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#a3a3a3', marginBottom: 4 }}>Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#c2510e' : '#f97316', color: '#fff', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Verificando...' : 'Iniciar Sesión'}
                </button>
                <button type="button" onClick={() => { setForgotMode(true); setError('') }}
                  style={{ background: 'none', border: 'none', width: '100%', marginTop: 6, fontSize: 11, color: '#737373', cursor: 'pointer', textDecoration: 'underline' }}>
                  Olvidé mi contraseña
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#525252', marginTop: 20 }}>
          © 2026 Dominicana Tour · Leymaken Platform
        </p>
        <div style={{
          marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #262626',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f97316', flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: '#525252', margin: 0 }}>
            Desarrollado por{' '}
            <a href="https://soymattlpzz.com" target="_blank" rel="noopener noreferrer"
              style={{ color: '#737373', fontWeight: 600, textDecoration: 'none' }}>
              soymattlpzz
            </a>
            {' '}· Leymaken Platform
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginInner />
    </Suspense>
  )
}
