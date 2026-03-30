'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PageLoading } from '@/components/shared/LoadingSpinner'

type TabKey = 'dashboard' | 'perfil'

export default function SponsorPortalPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [sponsor, setSponsor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  useEffect(() => {
    // Só espera a autenticação do usuário. Não esperamos mais nada externo!
    if (authLoading) return

    if (!user) {
      setLoading(false)
      return
    }

    const fetchSponsorData = async () => {
      try {
        const supabase = createSupabaseBrowser()

        // 1. Busca o evento diretamente pelo banco de dados
        const { data: eventData } = await supabase
          .from('events')
          .select('id')
          .eq(
            'slug',
            process.env.NEXT_PUBLIC_EVENT_SLUG || 'connect-valley-2026'
          )
          .single()

        if (!eventData) {
          console.error('Evento não encontrado')
          return
        }

        // 2. Puxa o patrocinador vinculado ao email
        const { data, error } = await supabase
          .from('event_sponsors')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('contact_email', user.email)
          .maybeSingle()

        if (error) {
          console.error('Erro ao buscar patrocinador:', error)
        }

        if (data) {
          setSponsor(data)
        }
      } catch (err) {
        console.error('Erro inesperado:', err)
      } finally {
        // A MÁGICA: Agora isso sempre vai rodar, desligando o loading infinito!
        setLoading(false)
      }
    }

    fetchSponsorData()
  }, [user, authLoading])

  // Guardião de Autenticação
  if (authLoading) return <PageLoading />
  if (!user) {
    router.push('/login')
    return null
  }
  if (loading) return <PageLoading />

  // Se não achou empresa, bloqueia o acesso
  if (!sponsor) {
    return (
      <div className="min-h-screen bg-[#030816] flex items-center justify-center p-6 font-sans">
        <div className="text-center bg-[#050B14] p-10 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full">
          <span className="text-6xl mb-6 block">🔒</span>
          <h1 className="text-2xl font-black text-white mb-4 uppercase">
            Acesso Restrito
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Nenhuma empresa encontrada para o e-mail:{' '}
            <strong className="text-white">{user.email}</strong>. Para acessar
            este portal, você precisa registrar uma empresa e reservar um stand.
          </p>
          <button
            onClick={() => router.push('/patrocinador/registro')}
            className="w-full py-4 bg-[#F2C94C] text-[#030816] rounded-full font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors"
          >
            Registrar Minha Empresa
          </button>
        </div>
      </div>
    )
  }

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Painel Geral', icon: '📊' },
    { key: 'perfil', label: 'Dados da Empresa', icon: '🏢' }
  ]

  return (
    <div className="min-h-screen bg-[#030816] font-sans">
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-12">
        <Link
          href="/evento"
          className="inline-flex items-center gap-2 text-sm text-[#F2C94C] hover:text-white mb-8 transition-colors font-bold uppercase tracking-widest"
        >
          ← Voltar ao evento
        </Link>

        {/* Header do Portal */}
        <div className="flex items-center justify-between mb-8 bg-[#050B14] p-6 rounded-3xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0055FF]/20 flex items-center justify-center border border-[#0055FF]/50 shadow-[0_0_15px_rgba(0,85,255,0.2)]">
              <span className="font-black text-2xl text-[#0055FF]">
                {sponsor.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="font-black text-white text-3xl uppercase tracking-tight">
                {sponsor.name}
              </h1>
              <p className="text-sm text-[#F2C94C] font-bold tracking-widest uppercase mt-1">
                Portal do Patrocinador • Cota {sponsor.tier}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              Seu Stand
            </div>
            <div className="text-4xl font-black text-white bg-white/5 px-6 py-2 rounded-xl border border-white/10">
              {sponsor.stand_number || '--'}
            </div>
          </div>
        </div>

        {/* Navegação de Abas */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-[#0055FF] text-white shadow-[0_0_15px_rgba(0,85,255,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTEÚDO DA ABA DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#050B14] border border-white/10 rounded-3xl p-8 shadow-xl text-center min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white uppercase mb-2">
                Seu Stand está ativo!
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">
                Sua empresa <strong>{sponsor.name}</strong> está oficialmente
                conectada ao Stand <strong>{sponsor.stand_number}</strong> no
                mapa interativo do evento.
              </p>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA PERFIL */}
        {activeTab === 'perfil' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-[#050B14] p-8 rounded-3xl border border-white/10 shadow-xl">
              <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                Informações da Empresa
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    disabled
                    value={sponsor.name}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white opacity-70 cursor-not-allowed font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    E-mail de Contato (Vínculo)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={sponsor.contact_email}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[#F2C94C] opacity-70 cursor-not-allowed font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Descrição / Resumo da Palestra
                  </label>
                  <textarea
                    disabled
                    value={
                      sponsor.description || 'Nenhuma descrição fornecida.'
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white opacity-70 cursor-not-allowed font-sans min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
