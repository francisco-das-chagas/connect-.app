'use client'

import { useState } from 'react'

export default function AgendamentoPalestra() {
  const [diaAtivo, setDiaAtivo] = useState(16)
  const [selecionado, setSelecionado] = useState<string | null>(null)

  const slots = [
    { id: '1', dia: 16, hora: '15:00', nome: 'Oficina 1' },
    { id: '2', dia: 16, hora: '16:30', nome: 'Oficina 3' },
    { id: '3', dia: 17, hora: '11:00', nome: 'Oficina 6' },
    { id: '4', dia: 17, hora: '14:30', nome: 'Oficina 9' }
  ]

  const lista = slots.filter(s => s.dia === diaAtivo)

  return (
    // Adicionei relative z-10 aqui para garantir que a página fique por cima de fundos do layout
    <div className="relative z-10 min-h-screen bg-[#030816] text-white p-6 md:p-20 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-5xl font-black uppercase font-display italic">
            RESERVE SEU <span className="text-[#F2C94C]">PALCO</span>
          </h1>
        </header>

        {/* SELETOR DE DIAS - Forçado com Z-50 */}
        <div className="flex gap-4 mb-12 relative z-50">
          <button
            type="button"
            onClick={e => {
              e.preventDefault()
              setDiaAtivo(16)
              setSelecionado(null)
            }}
            className={`flex-1 px-6 py-8 rounded-3xl border-2 transition-all cursor-pointer pointer-events-auto ${
              diaAtivo === 16
                ? 'border-[#F2C94C] bg-[#F2C94C] text-[#030816] font-black'
                : 'border-white/10 bg-white/5 text-gray-500'
            }`}
          >
            16 OUTUBRO
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault()
              setDiaAtivo(17)
              setSelecionado(null)
            }}
            className={`flex-1 px-6 py-8 rounded-3xl border-2 transition-all cursor-pointer pointer-events-auto ${
              diaAtivo === 17
                ? 'border-[#F2C94C] bg-[#F2C94C] text-[#030816] font-black'
                : 'border-white/10 bg-white/5 text-gray-500'
            }`}
          >
            17 OUTUBRO
          </button>
        </div>

        {/* LISTA DE HORÁRIOS */}
        <div className="grid grid-cols-1 gap-4 relative z-50">
          {lista.map(item => (
            <div
              key={item.id}
              onClick={() => setSelecionado(item.id)}
              className={`p-8 rounded-3xl border-2 cursor-pointer pointer-events-auto transition-all flex items-center justify-between ${
                selecionado === item.id
                  ? 'border-[#F2C94C] bg-[#F2C94C]/10'
                  : 'border-white/5 bg-[#050B14] hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-8">
                <span className="text-4xl font-black text-[#F2C94C]">
                  {item.hora}
                </span>
                <span className="text-xl font-bold uppercase">{item.nome}</span>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 ${selecionado === item.id ? 'bg-[#F2C94C] border-[#F2C94C]' : 'border-white/20'}`}
              ></div>
            </div>
          ))}
        </div>

        {/* BOTÃO FINAL */}
        <div className="mt-12 relative z-50">
          <button
            className={`w-full py-6 rounded-full font-black uppercase text-xl transition-all pointer-events-auto ${
              selecionado
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {selecionado ? 'CONFIRMAR AGENDAMENTO' : 'ESCOLHA UM HORÁRIO'}
          </button>
        </div>
      </div>
    </div>
  )
}
