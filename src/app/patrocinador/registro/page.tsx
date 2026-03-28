'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function RegistroPatrocinador() {
  const [cota, setCota] = useState('')

  // Configuração das Cotas com as cores exatas
  const cotas = [
    {
      id: 'prata',
      nome: 'Prata',
      preco: '4.997,00',
      border: 'border-slate-400',
      text: 'text-slate-400',
      bgActive: 'bg-slate-400/10'
    },
    {
      id: 'ouro',
      nome: 'Ouro',
      preco: '10.497,00',
      border: 'border-[#F2C94C]',
      text: 'text-[#F2C94C]',
      bgActive: 'bg-[#F2C94C]/10'
    },
    {
      id: 'ouro-plus',
      nome: 'Ouro+',
      preco: '12.497,00',
      border: 'border-yellow-500',
      text: 'text-yellow-500',
      bgActive: 'bg-yellow-500/15'
    },
    {
      id: 'diamante',
      nome: 'Diamante',
      preco: '25.787,00',
      border: 'border-cyan-400',
      text: 'text-cyan-400',
      bgActive: 'bg-cyan-400/10'
    }
  ]

  const selectedCotaData = cotas.find(c => c.id === cota)

  return (
    <div className="min-h-screen bg-[#030816] text-white font-sans py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <img
            src="/connect-2026.svg"
            alt="Logo"
            className="h-10 mx-auto mb-8 opacity-80"
          />
          <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter italic">
            SELECIONE SUA <span className="text-[#F2C94C]">COTA</span>
          </h1>
          <p className="text-gray-400 mt-4 text-lg">
            Defina seu nível de impacto no Connect Valley 2026.
          </p>
        </div>

        <form className="space-y-16">
          {/* 1. Seleção de Cota (Cards Lado a Lado) */}
          <section>
            <h3 className="text-xl font-display font-bold uppercase mb-6 flex items-center gap-3 text-gray-400">
              <span className="w-8 h-px bg-gray-600"></span> 1. Escolha o
              Investimento
            </h3>
            {/* grid-cols-1 para mobile, sm:grid-cols-2 para tablet, lg:grid-cols-4 para desktop (lado a lado) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cotas.map(item => (
                <div
                  key={item.id}
                  onClick={() => setCota(item.id)}
                  className={`relative cursor-pointer p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between min-h-[200px] ${
                    cota === item.id
                      ? `${item.border} ${item.bgActive} scale-105` // Aplica a cor da borda e o fundo quando selecionado
                      : 'border-white/5 bg-[#050B14] hover:border-white/20' // Visual padrão não selecionado
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 block mb-1">
                      Investimento
                    </span>
                    {/* O nome da cota fica com a cor respectiva */}
                    <h4
                      className={`text-3xl font-display font-black uppercase ${item.text}`}
                    >
                      {item.nome}
                    </h4>
                  </div>

                  <div className="mt-8">
                    <p
                      className={`text-2xl font-black ${cota === item.id ? 'text-white' : 'text-gray-300'}`}
                    >
                      <span className="text-sm font-normal mr-1">R$</span>
                      {item.preco}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Formulário Dinâmico */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
            {/* Dados da Empresa */}
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-display font-bold uppercase flex items-center gap-3">
                <div className="w-8 h-px bg-[#F2C94C]"></div> 2. Dados da
                Empresa
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome Fantasia"
                  className="w-full bg-[#050B14] border border-white/10 rounded-2xl py-4 px-6 focus:border-[#F2C94C] outline-none transition-all font-sans"
                />
                <input
                  type="text"
                  placeholder="CNPJ"
                  className="w-full bg-[#050B14] border border-white/10 rounded-2xl py-4 px-6 focus:border-[#F2C94C] outline-none transition-all font-sans"
                />
                <input
                  type="text"
                  placeholder="Link da Logomarca (Alta Resolução)"
                  className="w-full bg-[#050B14] border border-white/10 rounded-2xl py-4 px-6 focus:border-[#F2C94C] outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Painel de Palestra - Só ativa para Ouro, Ouro+ e Diamante */}
            <div
              className={`space-y-6 transition-all duration-500 ${cota === 'ouro' || cota === 'ouro-plus' || cota === 'diamante' ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}
            >
              <h3 className="text-lg md:text-xl font-display font-bold uppercase flex items-center gap-3">
                <div className="w-8 h-px bg-[#F2C94C]"></div> 3. Detalhes da
                Palestra
              </h3>
              <div className="space-y-4 p-8 rounded-3xl bg-[#050B14] border border-white/5">
                <input
                  type="text"
                  placeholder="Título do Tema"
                  className="w-full bg-transparent border-b border-white/10 py-3 focus:border-[#F2C94C] outline-none transition-all font-sans"
                />
                <textarea
                  placeholder="Resumo da apresentação..."
                  rows={3}
                  className="w-full bg-transparent border-b border-white/10 py-3 focus:border-[#F2C94C] outline-none transition-all resize-none font-sans mt-4"
                ></textarea>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 italic">
                  * Benefício exclusivo para cotas Ouro e Diamante
                </p>
              </div>
            </div>
          </section>

          {/* Botão de Ação (Ajustado o tamanho da fonte para text-sm/text-base) */}
          <div className="flex flex-col items-center pt-10 pb-20">
            <button
              type="button"
              className={`px-10 md:px-16 py-5 rounded-full font-display font-black uppercase tracking-widest text-sm md:text-base transition-all duration-300 shadow-xl ${
                cota
                  ? 'bg-[#F2C94C] text-[#030816] hover:bg-white hover:scale-105'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {cota
                ? `Confirmar Parceria - ${selectedCotaData?.nome}`
                : 'Selecione uma Cota'}
            </button>
            {cota && (
              <p className="text-gray-500 text-xs mt-4 font-sans text-center">
                Você será redirecionado para a escolha de horários.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
  