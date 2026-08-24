import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contacto — Dominicana Tour',
  description: 'Contacta con Dominicana Tour para reservas, informacion de tours o cualquier consulta.',
}

export default function ContactoPage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-dt-dark pt-28 pb-14 px-4 text-center mb-10">
        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">Estamos para ayudarte</p>
        <h1 className="font-display font-bold text-white text-4xl sm:text-5xl mb-4">Contacto</h1>
        <p className="text-white/45 max-w-sm mx-auto text-base">
          Respondemos en menos de 2 horas por WhatsApp.
        </p>
      </div>

      <section className="dt-sec">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* WhatsApp */}
          <a
            href="https://wa.me/18095550100"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 hover:border-[#25D366]/35 p-7 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h2 className="font-bold text-dt-text text-lg mb-1.5">WhatsApp</h2>
            <p className="text-dt-text-3 text-sm mb-4">Respuesta inmediata. Horario: 8am - 8pm</p>
            <span className="text-[#25D366] font-bold text-sm group-hover:underline">+1 (809) 555-0100 &rarr;</span>
          </a>

          {/* Email */}
          <a
            href="mailto:hola@dominicanatour.com"
            className="group block rounded-2xl border border-dt-border bg-dt-surface hover:border-accent/35 hover:bg-accent/5 p-7 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-bold text-dt-text text-lg mb-1.5">Email</h2>
            <p className="text-dt-text-3 text-sm mb-4">Respondemos en 24 horas habiles</p>
            <span className="text-accent font-bold text-sm group-hover:underline">hola@dominicanatour.com &rarr;</span>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/dominicanatour"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-dt-border bg-dt-surface hover:border-pink-500/35 hover:bg-pink-500/5 p-7 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-dt-text text-lg mb-1.5">Instagram</h2>
            <p className="text-dt-text-3 text-sm mb-4">Seguinos para ver nuestros tours en accion</p>
            <span className="text-pink-400 font-bold text-sm group-hover:underline">@dominicanatour &rarr;</span>
          </a>

          {/* Ubicacion */}
          <div className="rounded-2xl border border-dt-border bg-dt-surface p-7">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-dt-text text-lg mb-1.5">Ubicacion</h2>
            <p className="text-dt-text-3 text-sm">
              Operamos en toda la Republica Dominicana.<br />
              Punta Cana · Santo Domingo · Samana · Puerto Plata
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-dt-text-3 text-sm mb-4">Listo para reservar?</p>
          <Link href="/excursiones"
            className="inline-block bg-accent text-white font-bold px-8 py-3.5 rounded-2xl text-sm hover:bg-accent/90 transition-colors">
            Ver todos los tours
          </Link>
        </div>
      </div>
      </section>
    </div>
  )
}
