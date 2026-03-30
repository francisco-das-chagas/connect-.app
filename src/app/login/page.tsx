'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'
import { signInWithGoogle } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)
  const [isLogin, setIsLogin] = useState(true)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setMessage({ text: 'Preencha e-mail e senha.', type: 'error' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (isLogin) {
        // LÓGICA DE ENTRAR (LOGIN)
        const { data: authData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim()
          })

        if (signInError) throw signInError

        // LOGIN INTELIGENTE: Verifica se o usuário já completou o perfil na tabela 'event_attendees'
        const { data: attendee } = await supabase
          .from('event_attendees')
          .select('id, ticket_type')
          .eq('user_id', authData.user?.id)
          .maybeSingle()

        if (attendee) {
          // Se for uma empresa (sponsor), joga pro portal do patrocinador
          if (attendee.ticket_type === 'sponsor') {
            router.push('/sponsor-portal')
          } else {
            // Se for participante comum, joga pro evento
            router.push('/evento')
          }
        } else {
          // Entrou, mas a conta é "fantasma" (ainda não preencheu o perfil com CPF e dados)
          router.push('/completar-perfil')
        }
      } else {
        // LÓGICA DE CRIAR CONTA (SIGNUP)
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim()
        })

        if (signUpError) throw signUpError

        setMessage({
          text: 'Conta criada com sucesso! Redirecionando...',
          type: 'success'
        })

        // Conta nova sempre vai para a tela de completar o perfil para iniciar o registro
        setTimeout(() => {
          router.push('/completar-perfil')
        }, 1500)
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err)

      // Tradução de alguns erros comuns do Supabase
      let errorMessage = 'Erro ao processar a requisição.'
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'E-mail ou senha incorretos.'
      } else if (err.message.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
      } else if (err.message.includes('User already registered')) {
        errorMessage =
          'Este e-mail já está cadastrado. Clique em "Já tem cadastro" para entrar.'
      }

      setMessage({ text: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030816] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Importando as fontes e garantindo a identidade visual */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&family=Poppins:wght@300;400;600&display=swap');
        .font-display { font-family: 'Montserrat', sans-serif; font-weight: 900; letter-spacing: -0.02em; }
        .font-sans { font-family: 'Poppins', sans-serif; }
        .bg-blue-glow { background: radial-gradient(circle at center, rgba(0,85,255,0.15) 0%, rgba(3,8,22,0) 70%); }
      `
        }}
      />

      {/* Efeito de Brilho no Fundo */}
      <div className="absolute inset-0 bg-blue-glow opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        {/* Logo */}
        <img
          src="/connect-2026.svg"
          alt="Connect Valley Logo"
          className="h-12 md:h-16 mb-10 drop-shadow-2xl"
        />

        {/* Título Principal */}
        <h2 className="text-3xl md:text-4xl font-display uppercase text-white mb-10 text-center drop-shadow-[0_0_15px_rgba(0,85,255,0.4)]">
          O Futuro começa agora
        </h2>

        <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
          {/* Mensagem de Feedback */}
          {message && (
            <div
              className={`p-4 rounded-2xl text-sm text-center font-bold ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
            >
              {message.text}
            </div>
          )}

          {/* Campo de Email */}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Seu melhor e-mail"
            required
            className="w-full px-8 py-4 bg-[#0A1930]/50 border border-white/20 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F2C94C] focus:bg-[#0A1930] transition-all text-center text-lg font-medium"
          />

          {/* Campo de Senha */}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Sua senha secreta"
            required
            minLength={6}
            className="w-full px-8 py-4 bg-[#0A1930]/50 border border-white/20 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F2C94C] focus:bg-[#0A1930] transition-all text-center text-lg font-medium"
          />

          {/* Botão Principal Dourado */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-8 py-4 bg-[#F2C94C] text-[#030816] rounded-full font-display uppercase tracking-widest font-bold text-lg hover:bg-white hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center cursor-pointer shadow-[0_0_20px_rgba(242,201,76,0.2)]"
          >
            {loading
              ? 'Processando...'
              : isLogin
                ? 'Entrar no Evento'
                : 'Criar Minha Conta'}
          </button>
        </form>

        {/* Link de Trocar Modo */}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setMessage(null)
          }}
          className="mt-6 text-gray-400 text-sm hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
        >
          {isLogin
            ? 'Ainda não tem cadastro? Clique aqui para criar'
            : 'Já tem cadastro? Clique aqui para entrar'}
        </button>

        {/* Divisória "Ou" */}
        <div className="w-full flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-gray-500 text-sm uppercase tracking-widest font-bold">
            Ou
          </span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Botão de Login com Google */}
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="w-full px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-[1.02] transition-all active:scale-95 flex justify-center items-center gap-3 cursor-pointer shadow-lg"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Entrar com o Google
        </button>
      </div>
    </div>
  )
}
