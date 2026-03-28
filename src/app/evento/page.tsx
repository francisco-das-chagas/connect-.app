'use client'
import Link from 'next/link'

export default function EventoDashboard() {
  const quickAccessLinks = [
    {
      label: 'SUA AGENDA',
      desc: 'Palestras e horários',
      href: '/evento/agenda',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
      label: 'MEU INGRESSO',
      desc: 'QR Code de acesso',
      href: '/evento/qr-code',
      icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
    },
    {
      label: 'NETWORKING',
      desc: 'Conecte-se com players',
      href: '/evento/networking',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    {
      label: 'SPONSORS',
      desc: 'Marcas oficiais',
      href: '/evento/patrocinadores',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    }
  ]

  return (
    <div className="flex flex-col gap-14 w-full max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-20">
      {/* CABEÇALHO */}
      <div className="flex flex-col">
        <span className="text-[#0055FF] text-xs font-bold tracking-[0.2em] mb-3 uppercase font-display">
          Status: Credenciado
        </span>
        <h1 className="text-5xl md:text-7xl font-display font-black leading-[0.9] tracking-tight">
          <span className="text-white block mb-1">OLÁ,</span>
          <span className="text-[#F2C94C] italic block">PARTICIPANTE</span>
        </h1>
      </div>

      {/* BANNER CENTRAL */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-[#030A1A] to-[#051C42] border border-blue-900/30 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-10 shadow-2xl">
        <div className="max-w-2xl">
          <span className="text-[#F2C94C] text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-2 block font-display">
            Próximo Passo
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase mb-4 tracking-tight">
            Complete seu <span className="text-[#F2C94C]">Perfil</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed font-sans max-w-xl">
            Para tirar o máximo proveito do networking e receber contatos de
            patrocinadores, mantenha o seu perfil 100% atualizado.
          </p>
        </div>
        <Link
          href="/completar-perfil"
          className="bg-[#F2C94C] text-[#030816] px-10 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-white hover:scale-105 transition-all duration-300 flex-shrink-0 font-display shadow-[0_0_20px_rgba(242,201,76,0.2)]"
        >
          Atualizar Agora
        </Link>
      </div>

      {/* ACESSO RÁPIDO */}
      <div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-8 h-[2px] bg-[#F2C94C]"></div>
          <h3 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-[0.1em]">
            Acesso Rápido
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickAccessLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="bg-[#050B14] border border-white/5 rounded-2xl p-8 flex flex-col justify-between min-h-[200px] hover:border-[#F2C94C]/30 hover:bg-[#0A1120] transition-all duration-300 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#F2C94C]/50 transition-colors duration-300">
                <svg
                  className="w-5 h-5 text-gray-500 group-hover:text-[#F2C94C] transition-colors duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={link.icon}
                  />
                </svg>
              </div>
              <div className="mt-8">
                <h4 className="text-lg font-display font-black text-white uppercase tracking-wide group-hover:text-[#F2C94C] transition-colors duration-300">
                  {link.label}
                </h4>
                <p className="text-gray-500 text-xs md:text-sm font-sans mt-1">
                  {link.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
