'use client'

import { useState } from 'react'

// Dados de teste para o visual
const MOCK_USERS = [
  {
    id: '1',
    name: 'Dr. Roneely',
    role: 'CEO & Founder',
    company: "Galt's Valley",
    interests: ['Ecossistemas', 'Inovação'],
    photo: ''
  },
  {
    id: '2',
    name: 'Marcos Feitosa',
    role: 'Tech Lead',
    company: 'RF Group',
    interests: ['Desenvolvimento', 'IA'],
    photo: ''
  },
  {
    id: '3',
    name: 'Ana Silva',
    role: 'Investidora Angel',
    company: 'Valley Capital',
    interests: ['SaaS', 'Investimento'],
    photo: ''
  },
  {
    id: '4',
    name: 'Bruno Costa',
    role: 'Growth Hacking',
    company: 'StartUp Pro',
    interests: ['Marketing', 'Escalabilidade'],
    photo: ''
  }
]

export default function NetworkingPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = MOCK_USERS.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pt-10 pb-20 px-6 md:px-12">
      {/* 1. CABEÇALHO HERO */}
      <div className="flex flex-col">
        <span className="text-[#0055FF] text-xs font-bold tracking-[0.2em] mb-3 uppercase font-display">
          Conexões Reais
        </span>
        <h1 className="text-4xl md:text-6xl font-display font-black leading-[0.9] tracking-tight">
          <span className="text-white block mb-1">HUB DE</span>
          <span className="text-[#F2C94C] italic block">NETWORKING</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base mt-6 font-sans max-w-2xl">
          Encontre outros participantes, palestrantes e investidores. A sua
          próxima grande parceria pode estar a um clique.
        </p>
      </div>

      {/* 2. BARRA DE BUSCA PREMIUM */}
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, empresa ou interesse..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#050B14] border border-white/10 rounded-full py-4 pl-14 pr-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F2C94C] focus:bg-[#0A1120] transition-all font-sans shadow-lg"
        />
      </div>

      {/* 3. GRELHA DE PERFIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className="bg-[#050B14] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center hover:border-[#F2C94C]/30 hover:bg-[#0A1120] transition-all duration-300 group shadow-xl"
          >
            {/* Avatar / Foto */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0055FF] to-[#F2C94C] p-1 shadow-[0_0_20px_rgba(0,85,255,0.2)] group-hover:shadow-[0_0_30px_rgba(242,201,76,0.3)] transition-all">
                <div className="w-full h-full rounded-full bg-[#030816] flex items-center justify-center overflow-hidden">
                  {user.photo ? (
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-[#030816] rounded-full"></div>
            </div>

            {/* Informações */}
            <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide group-hover:text-[#F2C94C] transition-colors">
              {user.name}
            </h3>
            <p className="text-[#0055FF] text-xs font-bold uppercase tracking-widest mt-1">
              {user.role}
            </p>
            <p className="text-gray-500 text-sm mt-1 font-sans">
              {user.company}
            </p>

            {/* Tags de Interesse */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {user.interests.map(interest => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest font-bold text-gray-400 group-hover:border-white/20"
                >
                  {interest}
                </span>
              ))}
            </div>

            {/* Botão de Conectar */}
            <button className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-[#030816] transition-all duration-300 shadow-md">
              Ver Perfil
            </button>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-20 bg-[#050B14] border border-white/5 rounded-3xl">
          <h3 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-2">
            Ninguém encontrado
          </h3>
          <p className="text-gray-500 font-sans">
            Tente buscar por outro termo.
          </p>
        </div>
      )}
    </div>
  )
}
