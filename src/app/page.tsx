import Link from 'next/link';
import Image from 'next/image';
import { EVENT_CONFIG } from '@/config/event';
import Countdown from '@/components/landing/Countdown';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.name} — O Futuro Começa Agora`,
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
    <div className="min-h-screen bg-[#030816] text-white font-sans relative overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&family=Poppins:wght@300;400;600&display=swap');
        .font-display { font-family: 'Montserrat', sans-serif; font-weight: 900; letter-spacing: -0.02em; }
        .font-sans { font-family: 'Poppins', sans-serif; }
      `}} suppressHydrationWarning />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030816]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="/connect-2026.svg"
            alt="Connect Valley Logo"
            className="h-8 md:h-10 opacity-90"
          />
          <Link
            href="/login"
            className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#F2C94C] hover:text-[#030816] hover:border-[#F2C94C] transition-all duration-300"
          >
            Acessar Plataforma
          </Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src={EVENT_CONFIG.images.hero}
            alt="Connect Valley Hero"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030816]/40 via-[#030816]/80 to-[#030816]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
          <span className="text-[#0055FF] text-sm md:text-base font-bold tracking-[0.3em] uppercase mb-6 font-display">
            Conectando pessoas, ideias e negócios
          </span>
          <h1 className="text-5xl md:text-8xl font-display font-black uppercase tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl">
            <span className="text-white block">O Futuro</span>
            <span className="text-[#F2C94C] italic block">Começa Agora</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/login"
              className="bg-[#F2C94C] text-[#030816] px-10 py-5 rounded-full font-display font-black text-lg uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(242,201,76,0.3)]"
            >
              Garantir Minha Vaga
            </Link>
            <Link
              href="/patrocinador/registro"
              className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-full font-display font-bold text-lg uppercase tracking-widest hover:bg-white/10 transition-all duration-300"
            >
              Seja um Patrocinador
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SAVE THE DATE (Countdown) ===== */}
      <section className="relative z-10 -mt-20 px-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-[#050B14] to-[#0A1120] border border-white/10 rounded-3xl p-10 md:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <span className="text-gray-500 uppercase tracking-widest font-bold text-xs">Save the Date</span>
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-white mt-2">
              16 e 17 <span className="text-[#F2C94C]">Out</span>
            </h2>
            <div className="flex items-center gap-2 text-gray-400 mt-4">
              <svg className="w-5 h-5 text-[#F2C94C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="font-sans text-sm">{EVENT_CONFIG.venue} - {EVENT_CONFIG.location}</span>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <Countdown />
          </div>
        </div>
      </section>

      {/* ===== SOBRE & STATS ===== */}
      <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
          <Image
            src={EVENT_CONFIG.images.palco}
            alt="Palco Connect Valley"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#030816] via-transparent to-transparent" />
        </div>
        
        <div>
          <span className="text-[#F2C94C] font-bold tracking-[0.2em] uppercase text-xs mb-4 block font-display">O Ecossistema</span>
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight leading-tight mb-6">
            Muito mais que um evento,<br/><span className="text-white">um ecossistema.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-10 font-sans">
            {EVENT_CONFIG.manifesto}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[
              { value: EVENT_CONFIG.stats.speakers, label: 'Speakers' },
              { value: EVENT_CONFIG.stats.hours, label: EVENT_CONFIG.stats.hoursLabel },
              { value: EVENT_CONFIG.stats.participants, label: 'Participantes' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#050B14] border border-white/5 rounded-2xl p-6 text-center hover:border-[#F2C94C]/30 transition-colors">
                <div className="text-4xl font-display font-black text-[#F2C94C]">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APP FEATURES ===== */}
      <section className="py-24 px-6 bg-[#050B14] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#0055FF] font-bold tracking-[0.2em] uppercase text-xs mb-4 block font-display">Experiência Digital</span>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tight">
              Tudo na palma <span className="text-[#F2C94C] italic">da mão</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />, 
                label: 'Sua Agenda', desc: 'Monte sua programação ideal', href: '/evento/agenda' 
              },
              { 
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />, 
                label: 'Networking Hub', desc: 'Conecte-se com gigantes', href: '/evento/networking' 
              },
              { 
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />, 
                label: 'Ingresso Digital', desc: 'Seu acesso VIP via QR', href: '/evento' 
              },
              { 
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />, 
                label: 'Mapa Interativo', desc: 'Encontre stands e palcos', href: '/evento/mapa' 
              },
              { 
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, 
                label: 'Patrocinadores', desc: 'Negócios B2B em tempo real', href: '/patrocinador/registro' 
              },
              { 
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />, 
                label: 'Chat Integrado', desc: 'Mensagens diretas 1:1', href: '/evento' 
              },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="bg-[#030816] border border-white/10 rounded-3xl p-8 hover:border-[#F2C94C]/50 hover:bg-white/5 transition-all group">
                <svg className="w-10 h-10 text-gray-500 group-hover:text-[#F2C94C] mb-6 group-hover:scale-110 transition-transform origin-left" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.svg}
                </svg>
                <h3 className="font-display font-black text-xl text-white uppercase mb-2 group-hover:text-[#F2C94C] transition-colors">{item.label}</h3>
                <p className="text-sm text-gray-500 font-sans">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-16 px-6 bg-[#030816]">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
          <img
            src="/connect-2026.svg"
            alt="Connect Valley Logo"
            className="h-10 mb-8 opacity-80"
          />
          <p className="text-sm text-gray-500 font-sans mb-2">
            Connect Valley é uma iniciativa <span className="text-white font-bold">RF Group</span>.
          </p>
          <p className="text-sm text-gray-600 font-sans mb-8">
            Conectando propósitos, gerando resultados reais.
          </p>
          
          <div className="flex gap-6">
            {EVENT_CONFIG.social.instagram && (
              <a href={EVENT_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#F2C94C] hover:border-[#F2C94C] transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}