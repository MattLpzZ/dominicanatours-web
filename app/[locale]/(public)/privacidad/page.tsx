import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Dominicana Tour',
  description: 'Política de privacidad y tratamiento de datos de Dominicana Tour.',
}

export default function PrivacidadPage() {
  return (
    <div className="pt-24 pb-16 bg-dt-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm text-dt-text-3 hover:text-accent transition-colors">← Inicio</Link>
        </div>

        <h1 className="font-display font-bold text-dt-text text-4xl mb-2">Política de Privacidad</h1>
        <p className="text-dt-text-3 text-sm mb-10">Última actualización: agosto 2026</p>

        <div className="prose prose-sm max-w-none text-dt-text-2 space-y-8">

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">1. Información que Recopilamos</h2>
            <p>Al realizar una reserva, recopilamos únicamente los datos necesarios para prestarte el servicio:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Nombre completo</li>
              <li>Número de WhatsApp / teléfono</li>
              <li>Correo electrónico (opcional)</li>
              <li>Hotel o zona de hospedaje</li>
              <li>Fecha y detalles de la excursión reservada</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">2. Uso de tus Datos</h2>
            <p>Utilizamos tu información exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Confirmar y gestionar tu reserva</li>
              <li>Coordinar logística (punto de recogida, horarios)</li>
              <li>Enviarte recordatorios y confirmaciones por WhatsApp o email</li>
              <li>Mejorar nuestros servicios (datos estadísticos anonimizados)</li>
            </ul>
            <p className="mt-3"><strong>No vendemos ni compartimos</strong> tus datos personales con terceros con fines comerciales.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">3. Almacenamiento de Datos</h2>
            <p>Tus datos se almacenan en servidores seguros con cifrado SSL. Conservamos la información de reservas por un período de 2 años por obligaciones legales y contables, tras lo cual son eliminados de forma segura.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">4. Cookies y Tecnologías de Rastreo</h2>
            <p className="mb-3">Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio. Utilizamos las siguientes categorías:</p>

            <div className="space-y-4 mt-3">
              <div className="border border-dt-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-dt-text">Cookies esenciales</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-dt-border text-dt-text-3 font-medium">Siempre activas</span>
                </div>
                <p className="text-sm mb-2">Necesarias para que el sitio funcione correctamente. Sin ellas no podrías iniciar sesión ni completar una reserva.</p>
                <ul className="list-none space-y-1 text-xs text-dt-text-3 font-mono">
                  <li><span className="text-dt-text-2">next-auth.session-token</span> — sesión de usuario autenticado</li>
                  <li><span className="text-dt-text-2">dt-consent</span> — tu preferencia de cookies (1 año)</li>
                </ul>
              </div>

              <div className="border border-dt-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-dt-text">Cookies de analítica</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-accent/15 text-accent font-medium">Opcionales — requieren consentimiento</span>
                </div>
                <p className="text-sm mb-2">Nos permiten entender cómo se utiliza el sitio (páginas visitadas, tiempo de permanencia) para mejorar la experiencia. No contienen información personal identificable.</p>
                <ul className="list-none space-y-1 text-xs text-dt-text-3 font-mono">
                  <li><span className="text-dt-text-2">_ga, _gid</span> — Google Analytics (medición de tráfico y comportamiento anónimo)</li>
                </ul>
                <p className="text-xs text-dt-text-3 mt-2">Estas cookies solo se activan si aceptas el uso completo al ver el aviso de cookies.</p>
              </div>
            </div>

            <p className="mt-4 text-sm">Puedes cambiar tu preferencia en cualquier momento haciendo clic en <strong>Cookies</strong> al pie de esta página.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">5. Tus Derechos</h2>
            <p>De acuerdo con la normativa aplicable, tienes derecho a:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Acceso:</strong> solicitar qué datos tenemos sobre ti</li>
              <li><strong>Rectificación:</strong> corregir datos incorrectos</li>
              <li><strong>Eliminación:</strong> solicitar que borremos tus datos</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos</li>
            </ul>
            <p className="mt-3">Puedes ejercer estos derechos contactándonos por WhatsApp.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">6. Seguridad</h2>
            <p>Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o alteración, incluyendo cifrado HTTPS en todas las comunicaciones.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">7. Cambios a esta Política</h2>
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos a través del sitio web. El uso continuado de nuestros servicios implica la aceptación de la política actualizada.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">8. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad o protección de datos, contáctanos directamente por WhatsApp desde nuestra web.</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-dt-border text-center">
          <Link href="/terminos" className="text-sm text-accent hover:underline mr-4">Términos y Condiciones</Link>
          <Link href="/" className="text-sm text-dt-text-3 hover:text-dt-text transition-colors">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
