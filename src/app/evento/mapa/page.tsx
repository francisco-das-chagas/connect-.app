'use client'

import { useState } from 'react'
import Image from 'next/image'

// Criamos 35 stands automaticamente e colocamos alguns patrocinadores fictícios para testar o visual
const MOCK_STANDS = Array.from({ length: 35 }, (_, i) => {
  const num = i + 1
  const id = num.toString().padStart(2, '0') // Gera 01, 02, 03...

  if (num === 5)
    return {
      id,
      status: 'ocupado',
      empresa: "Galt's Valley",
      setor: 'Ecossistema',
      logo: 'GV',
      desc: 'Construindo ecossistemas independentes de inovação e tecnologia.'
    }
  if (num === 12)
    return {
      id,
      status: 'ocupado',
      empresa: 'RF Group',
      setor: 'Investimentos',
      logo: 'RF',
      desc: 'Acelerando startups e injetando capital inteligente no Vale.'
    }
  if (num === 28)
    return {
      id,
      status: 'ocupado',
      empresa: 'Tech Corp',
      setor: 'SaaS & Cloud',
      logo: 'TC',
      desc: 'Soluções em nuvem para escalar o seu negócio em tempo recorde.'
    }

  return {
    id,
    status: 'disponivel',
    empresa: null,
    setor: null,
    logo: null,
    desc: null
  }
})

export default function MapaEvento() {
  const [standSelecionado, setStandSelecionado] = useState<
    (typeof MOCK_STANDS)[0] | null
  >(null)

  return (
    <div className="min-h-screen bg-[#030816] text-white py-10 px-6 md:px-12 font-sans relative">
      <div className="max-w-7xl mx-auto">
        {/* CABEÇALHO */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <span className="text-[#0055FF] text-xs font-bold tracking-[0.2em] mb-3 uppercase font-display">
              Espaço 2026
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter">
              MAPA DO <span className="text-[#F2C94C] italic">EVENTO</span>
            </h1>
            <p className="text-gray-400 mt-4 text-sm md:text-base max-w-2xl">
              Explore a planta do Connect Valley. Clique nos stands numerados
              para conhecer as marcas oficiais, agendar reuniões e localizar a
              praça de alimentação ou áreas VIP.
            </p>
          </div>

          {/* Legenda Resumida */}
          <div className="flex flex-col gap-2 bg-[#050B14] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#0055FF]"></div>
              <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                Stands Ocupados
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border border-white/20"></div>
              <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                Stands Disponíveis
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LADO ESQUERDO: A Imagem do Mapa */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#050B14] p-2 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
              {/* === IMAGEM DO MAPA INSERIDA AQUI === */}
              {/* PASSO 1: Removi a classe bg-white desta div abaixo */}
              <div className="w-full aspect-video rounded-2xl relative overflow-hidden">
                <Image
                  src="/mapa-connect.jpg" // Nome do ficheiro que guardou na pasta public
                  alt="Planta Baixa do Connect Valley"
                  fill
                  // PASSO 2: Alterei de object-contain para object-cover
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* LADO DIREITO: Grelha Interativa de Stands */}
          <div className="bg-[#050B14] border border-white/10 rounded-3xl p-6 shadow-xl h-fit">
            <h3 className="text-xl font-display font-black text-white uppercase mb-6 tracking-wide flex items-center gap-3">
              <span className="w-4 h-1 bg-[#F2C94C]"></span> Diretório de Stands
            </h3>

            <div className="grid grid-cols-5 gap-3">
              {MOCK_STANDS.map(stand => (
                <button
                  key={stand.id}
                  onClick={() => setStandSelecionado(stand)}
                  className={`aspect-square rounded-xl flex items-center justify-center font-display font-black text-sm transition-all duration-300 ${
                    stand.status === 'ocupado'
                      ? 'bg-[#0055FF]/20 border border-[#0055FF]/50 text-[#0055FF] hover:bg-[#0055FF] hover:text-white shadow-[0_0_15px_rgba(0,85,255,0.2)]'
                      : 'bg-white/5 border border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {stand.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* POP-UP (MODAL) DO STAND CLICADO */}
      {standSelecionado && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#030816]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#050B14] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative scale-in-center">
            <button
              onClick={() => setStandSelecionado(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-2">
              <span className="text-[#F2C94C] font-display font-black text-4xl">
                Stand {standSelecionado.id}
              </span>
            </div>

            {standSelecionado.status === 'ocupado' ? (
              <div className="mt-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0055FF] to-cyan-400 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white font-display font-black text-xl">
                    {standSelecionado.logo}
                  </span>
                </div>
                <h3 className="text-2xl font-black uppercase text-white mb-1">
                  {standSelecionado.empresa}
                </h3>
                <span className="inline-block px-3 py-1 rounded-md bg-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-300 mb-4">
                  {standSelecionado.setor}
                </span>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  {standSelecionado.desc}
                </p>
                <button className="w-full py-4 bg-white text-[#030816] rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#F2C94C] transition-colors">
                  Falar com Representante
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <span className="text-gray-500 text-2xl">🏪</span>
                </div>
                <h3 className="text-2xl font-black uppercase text-white mb-2">
                  Stand Disponível
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  Este espaço nobre ainda está disponível para reserva. Destaque
                  a sua marca no centro do ecossistema Connect Valley.
                </p>
                <button className="w-full py-4 bg-transparent border border-[#F2C94C] text-[#F2C94C] rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#F2C94C] hover:text-[#030816] transition-colors">
                  Quero Patrocinar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
