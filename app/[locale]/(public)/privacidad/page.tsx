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
        <p className="text-dt-text-3 text-sm mb-10">Última actualización: junio 2026</p>

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
            <p>Nuestro sitio utiliza cookies técnicas esenciales para el funcionamiento del sitio (sesión, carrito). No utilizamos cookies de seguimiento de terceros ni publicidad comportamental.</p>
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
