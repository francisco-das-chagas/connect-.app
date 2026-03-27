'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithMagicLink, signInWithGoogle, signInWithPassword } from '@/lib/auth';
import { EVENT_CONFIG } from '@/config/event';

const COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'magic' | 'password'>('magic');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleMagicLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || cooldown > 0) return;
    setLoading(true);
    setError('');

    const { error } = await signInWithMagicLink(email);
    if (error) {
      const isRateLimit =
        error.status === 429 ||
        error.message?.toLowerCase().includes('rate') ||
        error.message?.toLowerCase().includes('limit');

      if (isRateLimit) {
        setError('Muitas tentativas de envio. Aguarde alguns minutos e tente novamente. Envie apenas uma vez e verifique sua caixa de entrada e spam.');
        setCooldown(COOLDOWN_SECONDS * 2);
      } else {
        setError('Erro ao enviar email. Verifique o endereco e tente novamente.');
      }
    } else {
      setEmailSent(true);
      setCooldown(COOLDOWN_SECONDS);
    }
    setLoading(false);
  }, [email, cooldown]);

  const handlePasswordLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    const { error } = await signInWithPassword(email, password);
    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setError('Email ou senha incorretos.');
      } else if (msg.includes('rate') || msg.includes('limit')) {
        setError('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } else {
      router.push('/evento');
    }
    setLoading(false);
  }, [email, password, router]);

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('provider') || msg.includes('not enabled') || msg.includes('unsupported')) {
        setError('Login com Google indisponivel no momento. Use o link magico por email.');
      } else {
        setError('Erro ao conectar com Google. Tente novamente.');
      }
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-hero-gradient flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Verifique seu email</h1>
        <p className="text-silver/70 text-center mb-2">
          Enviamos um link magico para
        </p>
        <p className="font-semibold text-accent-500 mb-6">{email}</p>
        <p className="text-sm text-silver/60 text-center max-w-xs">
          Clique no link do email para acessar o app. O link expira em 1 hora.
        </p>
        <p className="text-xs text-silver/30 text-center max-w-xs mt-2">
          Nao recebeu? Verifique a pasta de spam ou lixo eletronico.
        </p>
        <button
          onClick={() => {
            setEmailSent(false);
            setError('');
          }}
          disabled={cooldown > 0}
          className="mt-8 text-accent-500 font-medium text-sm disabled:opacity-50"
        >
          {cooldown > 0
            ? `Reenviar em ${cooldown}s`
            : 'Usar outro email'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="max-w-lg mx-auto px-6 pt-12">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1 text-silver/50 text-sm mb-8 hover:text-silver transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-500 flex items-center justify-center mb-4">
            <span className="text-xl font-bold text-navy-dark">CV</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Entrar no evento</h1>
          <p className="text-silver/60">{EVENT_CONFIG.name}</p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-6 py-3.5 rounded-2xl font-semibold text-white hover:bg-white/10 transition-colors mb-6 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-sm text-silver/60">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Toggle: Magic Link / Senha */}
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setLoginMode('magic'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              loginMode === 'magic'
                ? 'bg-accent-500 text-navy-dark'
                : 'text-silver/60 hover:text-silver'
            }`}
          >
            Link magico
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('password'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              loginMode === 'password'
                ? 'bg-accent-500 text-navy-dark'
                : 'text-silver/60 hover:text-silver'
            }`}
          >
            Email e senha
          </button>
        </div>

        {/* Login Form */}
        {loginMode === 'magic' ? (
          <form onSubmit={handleMagicLink}>
            <label className="block text-sm font-medium text-silver/70 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input mb-4"
              required
            />
            {error && (
              <p className="text-sm text-red-400 mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email || cooldown > 0}
              className="btn-primary w-full"
            >
              {loading
                ? 'Enviando...'
                : cooldown > 0
                  ? `Aguarde ${cooldown}s`
                  : 'Enviar link magico'}
            </button>
            <p className="text-xs text-silver/30 text-center mt-4">
              Voce recebera um link no email para acessar sem senha.
            </p>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin}>
            <label className="block text-sm font-medium text-silver/70 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input mb-4"
              required
            />
            <label className="block text-sm font-medium text-silver/70 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="input mb-4"
              required
            />
            {error && (
              <p className="text-sm text-red-400 mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <p className="text-xs text-silver/30 text-center mt-4">
              Acesso com email e senha para administradores e patrocinadores.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
