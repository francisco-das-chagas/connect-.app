import Link from 'next/link';
import Image from 'next/image';
import { EVENT_CONFIG } from '@/config/event';
import Countdown from '@/components/landing/Countdown';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.name} — O futuro comeca agora`,
  description: EVENT_CONFIG.manifesto,
  openGraph: {
    title: EVENT_CONFIG.name,
    description: EVENT_CONFIG.manifesto,
    type: 'website',
    images: [EVENT_CONFIG.images.hero],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: EVENT_CONFIG.name,
  description: EVENT_CONFIG.manifesto,
  startDate: EVENT_CONFIG.dates.start,
  endDate: EVENT_CONFIG.dates.end,
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: EVENT_CONFIG.venue,
    address: {
      '@type': 'PostalAddress',
      addressLocality: EVENT_CONFIG.city,
      addressRegion: EVENT_CONFIG.uf,
      addressCountry: 'BR',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: 'Connect Valley',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy text-white relative overflow-hidden">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={EVENT_CONFIG.images.hero}
            alt="Connect Valley"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/40 to-navy" />
        </div>

        {/* Sticky Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-white/5">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Image
              src={EVENT_CONFIG.images.icon}
              alt="Connect Valley"
              width={28}
              height={28}
              className="opacity-90"
            />
            <Link
              href="/login"
              className="bg-gold text-navy px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-montserrat hover:bg-gold-light transition-all"
            >
              Ingressos
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg mx-auto px-6 text-center pt-20">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src={EVENT_CONFIG.images.logo}
              alt="Connect Valley 2026"
              width={320}
              height={80}
              className="mx-auto"
              priority
            />
          </div>

          {/* Tagline */}
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-gold font-montserrat mb-2">
            O futuro comeca agora
          </h2>
          <p className="text-sm text-white/60 font-poppins">
            Conectando pessoas, ideias e negocios
          </p>

          {/* CTA Button */}
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-block bg-gold text-navy px-8 py-4 rounded-full font-bold text-base uppercase tracking-wider font-montserrat hover:bg-gold-light transition-all active:scale-[0.97] shadow-lg shadow-gold/20"
            >
              Garantir minha vaga
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 animate-bounce">
            <svg className="w-5 h-5 mx-auto text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ===== KEYWORDS MARQUEE ===== */}
      <section className="py-6 bg-navy-light border-y border-white/5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...EVENT_CONFIG.keywords, ...EVENT_CONFIG.keywords].map((kw, i) => (
            <span key={i} className="inline-flex items-center mx-6">
              <span className="text-sm md:text-base font-bold uppercase tracking-[0.15em] text-white/70 font-montserrat">
                {kw}
              </span>
              <span className="ml-6 w-1.5 h-1.5 rounded-full bg-gold/60" />
            </span>
          ))}
        </div>
      </section>

      {/* ===== SAVE THE DATE ===== */}
      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto text-center">
          <p className="section-label">Save the date</p>
          <h2 className="text-4xl md:text-5xl font-black uppercase font-montserrat tracking-tight mb-2">
            <span className="text-white">16 e 17</span>
          </h2>
          <h3 className="text-2xl md:text-3xl font-black uppercase font-montserrat text-gold tracking-tight">
            de Outubro
          </h3>

          {/* Countdown (client component) */}
          <Countdown />

          {/* Venue */}
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-center gap-2 text-white/60">
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-sm font-poppins">{EVENT_CONFIG.venue} - {EVENT_CONFIG.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOBRE / ABOUT ===== */}
      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6">
              <Image
                src={EVENT_CONFIG.images.palco}
                alt="Palco Connect Valley"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
            </div>
            <p className="section-label">Sobre</p>
            <h2 className="text-2xl font-bold uppercase font-montserrat tracking-tight mb-4">
              Muito mais que um evento,{' '}
              <span className="text-gold">um ecossistema.</span>
            </h2>
            <p className="text-sm text-white/60 font-poppins leading-relaxed">
              {EVENT_CONFIG.manifesto}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            {[
              { value: EVENT_CONFIG.stats.speakers, label: 'Speakers' },
              { value: EVENT_CONFIG.stats.hours, label: EVENT_CONFIG.stats.hoursLabel },
              { value: EVENT_CONFIG.stats.participants, label: 'Participantes' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-gold font-montserrat">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/60 font-montserrat mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== IMERSAO ===== */}
      <section className="py-16 px-6 bg-navy-light/30">
        <div className="max-w-lg mx-auto">
          <p className="section-label text-center">Viva a imersao</p>
          <h2 className="text-2xl font-bold uppercase font-montserrat tracking-tight text-center mb-8">
            2 dias intensivos de{' '}
            <span className="text-gold">programacao</span>
          </h2>

          {/* Day cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="card-gold text-center">
              <p className="text-xs text-gold uppercase font-montserrat font-bold tracking-wider">Dia 01</p>
              <p className="text-lg font-bold font-montserrat mt-1">16/10</p>
              <p className="text-[10px] text-white/50 mt-1">13h00 - 20h30</p>
            </div>
            <div className="card-gold text-center">
              <p className="text-xs text-gold uppercase font-montserrat font-bold tracking-wider">Dia 02</p>
              <p className="text-lg font-bold font-montserrat mt-1">17/10</p>
              <p className="text-[10px] text-white/50 mt-1">10h00 - 19h00</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: '🎤', title: 'Palestras com referencias nacionais', desc: 'Conteudo de alto nivel com speakers renomados' },
              { icon: '🔧', title: 'Oficinas praticas simultaneas', desc: 'IA, Financas, Marketing Digital, CRM e muito mais' },
              { icon: '🎙️', title: 'Paineis de sucesso', desc: 'Parceiros e patrocinadores trazem cases reais' },
              { icon: '🤝', title: '4 espacos simultaneos', desc: 'Operacao continua com networking integrado' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 card p-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold font-montserrat text-white">{item.title}</p>
                  <p className="text-xs text-white/50 font-poppins">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APP FEATURES ===== */}
      <section className="py-16 px-6">
        <div className="max-w-lg mx-auto">
          <p className="section-label text-center">No app</p>
          <h2 className="text-2xl font-bold uppercase font-montserrat tracking-tight text-center mb-8">
            Tudo na palma da{' '}
            <span className="text-gold">sua mao</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📋', label: 'Agenda', desc: 'Programacao completa', href: '/login' },
              { icon: '🤝', label: 'Networking', desc: 'Conecte-se', href: '/login' },
              { icon: '🏢', label: 'Patrocinadores', desc: 'Conheca os parceiros', href: '/login' },
              { icon: '📱', label: 'QR Badge', desc: 'Seu cracha digital', href: '/login' },
              { icon: '💬', label: 'Chat', desc: 'Mensagens 1:1', href: '/login' },
              { icon: '🗺️', label: 'Mapa', desc: 'Planta do evento', href: '/login' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="card-hover p-4 group"
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                <p className="font-bold text-sm font-montserrat text-white">{item.label}</p>
                <p className="text-xs text-white/60 font-poppins">{item.desc}</p>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-block bg-gold text-navy px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider font-montserrat hover:bg-gold-light transition-all active:scale-[0.97] shadow-lg shadow-gold/20"
            >
              Entrar no evento
            </Link>
            <p className="text-xs text-white/30 mt-3 font-poppins">
              Cadastre-se para acessar a agenda, networking e muito mais
            </p>
          </div>
        </div>
      </section>

      {/* ===== GALERIA ===== */}
      <section className="py-12 overflow-hidden">
        <div className="max-w-lg mx-auto px-6 mb-6">
          <p className="section-label text-center">Galeria</p>
          <h2 className="text-xl font-bold uppercase font-montserrat tracking-tight text-center">
            Momentos <span className="text-gold">inesqueciveis</span>
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-6 snap-x">
          {EVENT_CONFIG.images.galeria.map((src, i) => (
            <div key={i} className="flex-shrink-0 w-64 h-40 rounded-xl overflow-hidden snap-start border border-white/5">
              <Image
                src={src}
                alt={`Momento Connect Valley ${i + 1}`}
                width={256}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-lg mx-auto text-center">
          <Image
            src={EVENT_CONFIG.images.logo}
            alt="Connect Valley"
            width={160}
            height={40}
            className="mx-auto mb-4 opacity-60"
          />
          <p className="text-xs text-white/30 font-poppins mb-1">
            Connect Valley e uma iniciativa RF Group.
          </p>
          <p className="text-xs text-white/20 font-poppins">
            Conectando propositos, gerando resultados.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            {EVENT_CONFIG.social.instagram && (
              <a href={EVENT_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {EVENT_CONFIG.social.linkedin && (
              <a href={EVENT_CONFIG.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            )}
            {EVENT_CONFIG.social.website && (
              <a href={EVENT_CONFIG.social.website} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-gold transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
