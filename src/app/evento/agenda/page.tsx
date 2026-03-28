'use client'

import { useState } from 'react'

// Dados puramente visuais para podermos trabalhar no Design sem bloqueios do banco de dados
const MOCK_SESSIONS = [
  {
    id: '1',
    title: 'Credenciamento & Welcome Coffee',
    description: '',
    speaker_name: '',
    speaker_photo_url: '',
    start_time: '2026-10-16T09:00:00',
    end_time: '2026-10-16T10:00:00',
    room: 'Lobby Principal',
    track: '',
    session_type: 'Networking'
  },
  {
    id: '2',
    title: 'Abertura Oficial: O Futuro Começa Agora',
    description: '',
    speaker_name: 'Dr. Roneely',
    speaker_photo_url: '',
    start_time: '2026-10-16T10:00:00',
    end_time: '2026-10-16T11:00:00',
    room: 'Palco Valley',
    track: 'Inovação',
    session_type: 'Keynote'
  },
  {
    id: '3',
    title: "Galt's Gulch: Construindo Ecossistemas Independentes",
    description: '',
    speaker_name: 'Marcos Feitosa',
    speaker_photo_url: '',
    start_time: '2026-10-16T11:30:00',
    end_time: '2026-10-16T12:30:00',
    room: 'Palco Valley',
    track: 'Business',
    session_type: 'Painel'
  },
  {
    id: '4',
    title: 'A Arte do Pitch: Conquistando o Capital',
    description: '',
    speaker_name: 'RF Group',
    speaker_photo_url: '',
    start_time: '2026-10-17T14:00:00',
    end_time: '2026-10-17T15:30:00',
    room: 'Sala VIP',
    track: 'Investimento',
    session_type: 'Workshop'
  }
]

export default function AgendaPage() {
  // Estados para controlar a interface (sem depender de banco de dados)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<string>('2026-10-16')

  const toggleFavorite = (sessionId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  const getHoraFormatada = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '00:00'
    }
  }

  const formatarData = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  // Organizando os nossos dados visuais
  const grouped = {
    '2026-10-16': MOCK_SESSIONS.filter(s =>
      s.start_time.startsWith('2026-10-16')
    ),
    '2026-10-17': MOCK_SESSIONS.filter(s =>
      s.start_time.startsWith('2026-10-17')
    )
  }
  const days = Object.keys(grouped)
  const tracks = [...new Set(MOCK_SESSIONS.map(s => s.track).filter(Boolean))]

  let filteredSessions = grouped[activeDay as keyof typeof grouped] || []
  if (activeTrack) {
    filteredSessions = filteredSessions.filter(s => s.track === activeTrack)
  }

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pt-10 pb-20">
      {/* CABEÇALHO HERO */}
      <div className="flex flex-col mb-4">
        <span className="text-[#0055FF] text-xs font-bold tracking-[0.2em] mb-3 uppercase font-display">
          Cronograma Oficial
        </span>
        <h1 className="text-4xl md:text-6xl font-display font-black leading-[0.9] tracking-tight">
          <span className="text-white block mb-1">SUA</span>
          <span className="text-[#F2C94C] italic block">AGENDA</span>
        </h1>
      </div>

      {/* FILTROS (DIAS E TRILHAS) */}
      <div className="flex flex-col gap-6 border-b border-white/10 pb-8">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-shrink-0 px-8 py-4 rounded-2xl font-display font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                activeDay === day
                  ? 'bg-[#F2C94C] text-[#030816] shadow-[0_0_20px_rgba(242,201,76,0.2)]'
                  : 'bg-[#050B14] text-gray-400 hover:bg-white/5 hover:text-white border border-white/5'
              }`}
            >
              Dia {i + 1} · {formatarData(day + 'T00:00:00')}
            </button>
          ))}
        </div>

        {tracks.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mr-2 font-display">
              Trilhas:
            </span>
            <button
              onClick={() => setActiveTrack(null)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                !activeTrack
                  ? 'bg-white text-[#030816]'
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              Todas
            </button>
            {tracks.map(track => (
              <button
                key={track}
                onClick={() =>
                  setActiveTrack(activeTrack === track ? null : track)
                }
                className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTrack === track
                    ? 'bg-white text-[#030816]'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {track}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LISTA DE EVENTOS (TIMELINE PREMIUM) */}
      <div className="flex flex-col gap-6 mt-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-20 bg-[#050B14] border border-white/5 rounded-3xl">
            <h3 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-2">
              Nenhuma sessão encontrada
            </h3>
            <p className="text-gray-500 font-sans">
              A agenda para este dia ainda está a ser preparada.
            </p>
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              className="bg-[#050B14] border border-white/5 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10 hover:border-[#F2C94C]/30 hover:bg-[#0A1120] transition-all duration-300 group shadow-lg"
            >
              {/* Bloco de Horário */}
              <div className="flex flex-col items-start md:items-end min-w-[140px]">
                <span className="text-[#F2C94C] font-display font-black text-3xl tracking-wider group-hover:drop-shadow-[0_0_10px_rgba(242,201,76,0.4)] transition-all">
                  {getHoraFormatada(session.start_time)}
                </span>
                <span className="text-gray-500 font-sans text-xs uppercase tracking-widest mt-1 font-bold">
                  Até {getHoraFormatada(session.end_time)}
                </span>
              </div>

              {/* Linha Divisória Vertical */}
              <div className="hidden md:block w-px h-20 bg-white/10 group-hover:bg-[#F2C94C]/50 transition-colors duration-300"></div>

              {/* Informações da Palestra */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {session.session_type && (
                    <span className="px-3 py-1 rounded-md bg-[#0055FF]/10 border border-[#0055FF]/30 text-[10px] uppercase tracking-widest font-bold text-[#0055FF]">
                      {session.session_type}
                    </span>
                  )}
                  {session.track && (
                    <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                      {session.track}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 group-hover:text-white transition-colors leading-tight">
                  {session.title}
                </h3>

                <div className="flex flex-col md:flex-row md:items-center gap-4 text-gray-500 text-sm font-sans mt-4">
                  {session.speaker_name && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-[10px] text-white">👤</span>
                      </div>
                      <span className="text-gray-300 font-bold">
                        {session.speaker_name}
                      </span>
                    </div>
                  )}
                  {session.room && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-[#F2C94C]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {session.room}
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Favoritar (Estrela) */}
              <div className="mt-4 md:mt-0 flex justify-end">
                <button
                  onClick={() => toggleFavorite(session.id)}
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                    favorites.has(session.id)
                      ? 'bg-[#F2C94C]/10 border-[#F2C94C]/50 text-[#F2C94C] shadow-[0_0_15px_rgba(242,201,76,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:border-[#F2C94C]/50 hover:text-[#F2C94C]'
                  }`}
                  title={
                    favorites.has(session.id)
                      ? 'Remover da minha agenda'
                      : 'Adicionar à minha agenda'
                  }
                >
                  <svg
                    className="w-6 h-6"
                    fill={favorites.has(session.id) ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
