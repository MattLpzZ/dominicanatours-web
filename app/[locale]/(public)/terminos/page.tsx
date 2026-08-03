import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Dominicana Tour',
  description: 'Términos y condiciones de servicio de Dominicana Tour.',
}

export default function TerminosPage() {
  return (
    <div className="pt-24 pb-16 bg-dt-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm text-dt-text-3 hover:text-accent transition-colors">← Inicio</Link>
        </div>

        <h1 className="font-display font-bold text-dt-text text-4xl mb-2">Términos y Condiciones</h1>
        <p className="text-dt-text-3 text-sm mb-10">Última actualización: junio 2026</p>

        <div className="prose prose-sm max-w-none text-dt-text-2 space-y-8">

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">1. Aceptación de los Términos</h2>
            <p>Al realizar una reserva en Dominicana Tour, aceptas plenamente estos términos y condiciones. Si no estás de acuerdo con alguno de estos términos, te pedimos que no utilices nuestros servicios.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">2. Reservas y Pagos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Se requiere un anticipo del <strong>20%</strong> del total para confirmar una reserva.</li>
              <li>El saldo restante (80%) se abona el día de la excursión antes de la partida.</li>
              <li>Los precios están expresados en dólares estadounidenses (USD).</li>
              <li>Las reservas están sujetas a disponibilidad y se confirman una vez recibido el anticipo.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">3. Política de Cancelación</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Cancelación gratuita:</strong> hasta 48 horas antes de la excursión, con reembolso total del anticipo.</li>
              <li><strong>Entre 24 y 48 horas:</strong> se retiene el 50% del anticipo como cargo de gestión.</li>
              <li><strong>Menos de 24 horas:</strong> no se realizan reembolsos del anticipo.</li>
              <li>En caso de cancelación por causas de fuerza mayor (clima extremo, desastres naturales), se ofrece reprogramación sin costo adicional.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">4. Responsabilidades del Cliente</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Presentarse en el punto de encuentro acordado a la hora indicada.</li>
              <li>Informar sobre condiciones médicas o limitaciones físicas relevantes antes de la excursión.</li>
              <li>Traer documentos de identidad válidos para excursiones que lo requieran.</li>
              <li>Respetar las instrucciones de los guías por razones de seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">5. Limitación de Responsabilidad</h2>
            <p>Dominicana Tour no se hace responsable por pérdidas personales, lesiones o daños materiales durante las excursiones, salvo en casos de negligencia directa probada de nuestra parte. Recomendamos contratar un seguro de viaje.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">6. Modificaciones al Servicio</h2>
            <p>Nos reservamos el derecho de modificar o cancelar excursiones por condiciones meteorológicas adversas, razones de seguridad u otras circunstancias fuera de nuestro control, ofreciendo en todo momento una alternativa o reembolso completo.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-dt-text text-xl mb-3">7. Contacto</h2>
            <p>Para consultas sobre estos términos, escríbenos a través de WhatsApp o visita nuestra página de contacto.</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-dt-border text-center">
          <Link href="/privacidad" className="text-sm text-accent hover:underline mr-4">Política de Privacidad</Link>
          <Link href="/" className="text-sm text-dt-text-3 hover:text-dt-text transition-colors">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
