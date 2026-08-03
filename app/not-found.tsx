import Link from 'next/link'

export default function RootNotFound() {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0A0A0A', color: '#FAFAFA', fontFamily: 'system-ui, sans-serif',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '5rem', fontWeight: 900, color: '#E85D20', margin: 0, lineHeight: 1 }}>404</p>
          <p style={{ fontSize: '1.1rem', color: '#A3A3A3', margin: '1rem 0 2rem' }}>Página no encontrada</p>
          <a href="/" style={{ background: '#E85D20', color: '#fff', padding: '0.75rem 2rem',
                               borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 700 }}>
            Volver al inicio
          </a>
        </div>
      </body>
    </html>
  )
}
