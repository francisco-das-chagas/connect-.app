'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseBrowser } from '@/lib/supabase'
import { EVENT_CONFIG } from '@/config/event'
import { useAuth } from '@/hooks/useAuth' // NOVO: Trazendo a identidade do usuário!

// === MOCK DOS STANDS (Do seu Mapa Interativo) ===
const MOCK_STANDS = Array.from({ length: 35 }, (_, i) => {
  const num = i + 1
  const id = num.toString().padStart(2, '0')
  if (num === 5 || num === 12 || num === 28) return { id, status: 'ocupado' }
  return { id, status: 'disponivel' }
})

export default function RegistroPatrocinador() {
  const router = useRouter()
  const { user } = useAuth() // NOVO: Pegando os dados de quem está logado

  const [etapa, setEtapa] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [cota, setCota] = useState('')
  const [dados, setDados] = useState({
    nome: '',
    cnpj: '',
    logo_url: '',
    titulo_palestra: '',
    resumo_palestra: ''
  })

  const [standSelecionado, setStandSelecionado] = useState<string | null>(null)

  const cotas = [
    {
      id: 'silver',
      nome: 'Prata',
      preco: '4.997,00',
      border: 'border-slate-400',
      text: 'text-slate-400',
      bgActive: 'bg-slate-400/10'
    },
    {
      id: 'gold',
      nome: 'Ouro',
      preco: '10.497,00',
      border: 'border-[#F2C94C]',
      text: 'text-[#F2C94C]',
      bgActive: 'bg-[#F2C94C]/10'
    },
    {
      id: 'platinum',
      nome: 'Ouro+',
      preco: '12.497,00',
      border: 'border-yellow-500',
      text: 'text-yellow-500',
      bgActive: 'bg-yellow-500/15'
    },
    {
      id: 'diamond',
      nome: 'Diamante',
      preco: '25.787,00',
      border: 'border-cyan-400',
      text: 'text-cyan-400',
      bgActive: 'bg-cyan-400/10'
    }
  ]

  const irParaMapa = () => {
    if (!cota || !dados.nome) {
      setErro('Por favor, selecione uma cota e preencha o Nome Fantasia.')
      return
    }
    setErro('')
    setEtapa(2)
  }

  const finalizarCadastro = async () => {
    if (!standSelecionado) {
      setErro('Por favor, escolha um stand no mapa.')
      return
    }
    if (!user?.email) {
      setErro('Usuário não autenticado. Faça login novamente.')
      return
    }

    setLoading(true)
    setErro('')

    try {
      const supabase = createSupabaseBrowser()

      // 1. Achar o ID do Evento
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', EVENT_CONFIG.slug)
        .single()

      if (eventError || !event) {
        throw new Error('Evento principal não encontrado no banco.')
      }

      // 2. Salvar a Empresa e VINCULAR AO SEU E-MAIL!
      const { error: insertError } = await supabase
        .from('event_sponsors')
        .insert({
          event_id: event.id,
          name: dados.nome,
          description: dados.resumo_palestra || null,
          logo_url: dados.logo_url || null,
          tier: cota,
          stand_number: standSelecionado,
          contact_email: user.email, // A PEÇA CHAVE PARA A PRÓXIMA TELA!
          active: true
        })

      if (insertError) {
        console.error('Erro do banco:', insertError)
        throw new Error(
          'Erro ao salvar no banco. O stand já pode estar ocupado.'
        )
      }

      setEtapa(3)

      setTimeout(() => {
        router.push('/sponsor-portal')
      }, 3000)
    } catch (err: any) {
      console.error('MEU ERRO:', err)
      setErro(err.message || 'Erro inesperado ao registrar empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030816] text-white font-sans py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* ETAPA 1 */}
        {etapa === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
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

            <div className="space-y-16 max-w-6xl mx-auto">
              <section>
                <h3 className="text-xl font-display font-bold uppercase mb-6 flex items-center gap-3 text-gray-400">
                  <span className="w-8 h-px bg-gray-600"></span> 1. Escolha o
                  Investimento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cotas.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setCota(item.id)}
                      className={`relative cursor-pointer p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between min-h-[200px] ${
                        cota === item.id
                          ? `${item.border} ${item.bgActive} scale-105`
                          : 'border-white/5 bg-[#050B14] hover:border-white/20'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 block mb-1">
                          Investimento
                        </span>
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

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                <div className="space-y-6">
                  <h3 className="text-lg md:text-xl font-display font-bold uppercase flex items-center gap-3">
                    <div className="w-8 h-px bg-[#F2C94C]"></div> 2. Dados da
                    Empresa
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nome Fantasia *"
                      value={dados.nome}
                      onChange={e =>
                        setDados({ ...dados, nome: e.target.value })
                      }
                      className="w-full bg-[#050B14] border border-white/10 rounded-2xl py-4 px-6 focus:border-[#F2C94C] outline-none transition-all font-sans"
                    />
                    <input
                      type="text"
                      placeholder="CNPJ"
                      value={dados.cnpj}
                      onChange={e =>
                        setDados({ ...dados, cnpj: e.target.value })
                      }
                      className="w-full bg-[#050B14] border border-white/10 rounded-2xl py-4 px-6 focus:border-[#F2C94C] outline-none transition-all font-sans"
                    />
                    <input
                      type="text"
                      placeholder="Link da Logomarca (Alta Resolução)"
                      value={dados.logo_url}
                      onChange={e =>
                        setDados({ ...dados, logo_url: e.target.value })
                      }
                      className="w-full bg-[#050B14] border border-white/10 rounded-2xl py-4 px-6 focus:border-[#F2C94C] outline-none transition-all font-sans"
                    />
                  </div>
                </div>
              </section>

              {erro && (
                <p className="text-red-400 text-center font-bold">{erro}</p>
              )}

              <div className="flex flex-col items-center pt-10 pb-20">
                <button
                  onClick={irParaMapa}
                  className={`px-10 md:px-16 py-5 rounded-full font-display font-black uppercase tracking-widest text-sm md:text-base transition-all duration-300 shadow-xl ${
                    cota && dados.nome
                      ? 'bg-[#F2C94C] text-[#030816] hover:bg-white hover:scale-105'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {cota && dados.nome
                    ? `Avançar para o Mapa`
                    : 'Preencha os dados'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 2 */}
        {etapa === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div>
                <button
                  onClick={() => setEtapa(1)}
                  className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-2"
                >
                  ← Voltar para dados
                </button>
                <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter">
                  ESCOLHA SEU <span className="text-[#0055FF]">STAND</span>
                </h2>
                <p className="text-gray-400 mt-4 text-sm md:text-base max-w-2xl">
                  Bem-vindo, {dados.nome}! Selecione um dos stands disponíveis
                  abaixo para cravar a sua marca no evento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#050B14] p-2 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="w-full aspect-video rounded-2xl relative overflow-hidden">
                    <Image
                      src="/mapa-connect.jpg"
                      alt="Planta Baixa"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#050B14] border border-white/10 rounded-3xl p-6 shadow-xl h-fit flex flex-col">
                <h3 className="text-xl font-display font-black text-white uppercase mb-6 tracking-wide flex items-center gap-3">
                  <span className="w-4 h-1 bg-[#F2C94C]"></span> Diretório de
                  Stands
                </h3>

                <div className="grid grid-cols-5 gap-3 mb-8">
                  {MOCK_STANDS.map(stand => (
                    <button
                      key={stand.id}
                      disabled={stand.status === 'ocupado'}
                      onClick={() => setStandSelecionado(stand.id)}
                      className={`aspect-square rounded-xl flex items-center justify-center font-display font-black text-sm transition-all duration-300 ${
                        stand.status === 'ocupado'
                          ? 'bg-red-500/10 border border-red-500/20 text-red-500/50 cursor-not-allowed'
                          : standSelecionado === stand.id
                            ? 'bg-[#0055FF] border border-[#0055FF] text-white scale-110 shadow-[0_0_15px_rgba(0,85,255,0.5)]'
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:border-[#0055FF]/50 hover:text-white'
                      }`}
                    >
                      {stand.id}
                    </button>
                  ))}
                </div>

                {erro && (
                  <p className="text-red-400 text-sm text-center mb-4 font-bold">
                    {erro}
                  </p>
                )}

                <button
                  onClick={finalizarCadastro}
                  disabled={!standSelecionado || loading}
                  className={`w-full py-5 rounded-2xl font-display font-black uppercase tracking-widest text-sm transition-all shadow-xl mt-auto ${
                    standSelecionado
                      ? 'bg-[#0055FF] text-white hover:bg-blue-600'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading
                    ? 'Reservando...'
                    : standSelecionado
                      ? `Confirmar Stand ${standSelecionado}`
                      : 'Selecione um Stand'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 3 */}
        {etapa === 3 && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-8 border border-green-500/50">
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase text-white mb-4">
              Lugar Garantido!
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              A empresa <strong className="text-white">{dados.nome}</strong>{' '}
              agora é a dona oficial do{' '}
              <strong className="text-[#F2C94C]">
                Stand {standSelecionado}
              </strong>
              .
              <br />
              <br />
              Redirecionando você para o Portal do Patrocinador...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
