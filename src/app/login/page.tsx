'use client'

import { useState } from 'react'
import { signInWithMagicLink, signInWithGoogle } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)
  const [isLogin, setIsLogin] = useState(true)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await signInWithMagicLink(email.trim())

      if (error) {
        console.error('Erro de autenticação:', error)
        if (error.message.includes('rate_limit')) {
          setMessage({
            text: 'Muitas tentativas! O Supabase bloqueou temporariamente. Tente com o Google abaixo.',
            type: 'error'
          })
        } else {
          setMessage({
            text: 'Erro ao enviar o link. Verifique o terminal.',
            type: 'error'
          })
        }
      } else {
        setMessage({
          text: 'Link mágico enviado! Verifique a sua caixa de entrada (e a pasta de spam).',
          type: 'success'
        })
        setEmail('')
      }
    } catch (err) {
      console.error('Erro fatal:', err)
      setMessage({
        text: 'Erro de conexão com o banco de dados.',
        type: 'error'
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isLogin ? 'Bem-vindo de volta!' : 'Junte-se ao Evento'}
        </h1>
        <p className="text-silver/70 max-w-sm mx-auto">
          {isLogin
            ? 'Insira o seu e-mail para receber o seu link de acesso.'
            : 'Crie a sua conta rapidamente usando apenas o seu e-mail.'}
        </p>
      </div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-silver/80 mb-1"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu.nome@empresa.com"
              required
              className="w-full px-4 py-3 bg-navy-dark border border-white/10 rounded-xl text-white placeholder:text-silver/30 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-accent-500 hover:bg-accent-400 text-navy-dark font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center cursor-pointer"
          >
            {loading
              ? 'A enviar link...'
              : isLogin
                ? 'Entrar com Link Mágico ✨'
                : 'Criar Conta ✨'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-silver/60 hover:text-white transition-colors cursor-pointer"
          >
            {isLogin
              ? 'Ainda não tem cadastro? Clique aqui para criar'
              : 'Já tem cadastro? Clique aqui para entrar'}
          </button>
        </div>

        {/* Divisória */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs text-silver/50 uppercase">Ou</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Botão de Login com Google para facilitar os nossos testes! */}
        <button
          onClick={() => signInWithGoogle()}
          className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
