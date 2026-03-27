'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/hooks/useEvent';
import { useAttendee } from '@/hooks/useAttendee';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { QRBadge } from '@/components/shared/QRBadge';
import { getInitials } from '@/lib/utils';
import type { EventSession, EventInteraction } from '@/types';

export default function MeuPerfilPage() {
  const router = useRouter();
  const { user, signOut: authSignOut } = useAuth();
  const { event } = useEvent();
  const { attendee } = useAttendee();
  const [favoriteSessions, setFavoriteSessions] = useState<EventSession[]>([]);
  const [interactions, setInteractions] = useState<EventInteraction[]>([]);
  const [contacts, setContacts] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'badge' | 'agenda' | 'contatos' | 'config'>('badge');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attendee || !event) return;
    const supabase = createSupabaseBrowser();

    Promise.all([
      supabase
        .from('event_session_favorites')
        .select('session_id')
        .eq('attendee_id', attendee.id)
        .then(async ({ data: favs }) => {
          if (favs && favs.length > 0) {
            const ids = favs.map((f) => f.session_id);
            const { data: sessions } = await supabase
              .from('event_sessions')
              .select('id, title, description, speaker_name, speaker_title, speaker_photo_url, start_time, end_time, room, track, session_type')
              .in('id', ids)
              .order('start_time', { ascending: true });
            if (sessions) setFavoriteSessions(sessions as EventSession[]);
          }
        }),
      supabase
        .from('event_interactions')
        .select('id, event_id, attendee_id, sponsor_id, interaction_type, metadata, created_at')
        .eq('attendee_id', attendee.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data) setInteractions(data as EventInteraction[]);
        }),
      supabase
        .from('event_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('attendee_id', attendee.id)
        .eq('interaction_type', 'contact_exchange')
        .then(({ count }) => {
          if (count) setContacts(count);
        }),
    ]).catch((err) => {
      console.error('Error loading profile data:', err);
    }).finally(() => setLoading(false));
  }, [attendee, event]);

  const handleSignOut = async () => {
    if (!window.confirm('Tem certeza que deseja sair da sua conta?')) return;
    await authSignOut();
    router.push('/');
  };

  if (loading || !attendee) return <PageLoading />;

  const tabs = [
    { key: 'badge' as const, label: 'Badge', icon: '🎫' },
    { key: 'agenda' as const, label: 'Agenda', icon: '📋' },
    { key: 'contatos' as const, label: 'Contatos', icon: '👥' },
    { key: 'config' as const, label: 'Config', icon: '⚙️' },
  ];

  return (
    <div className="page-container pt-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        {attendee.avatar_url ? (
          <img
            src={attendee.avatar_url}
            alt={attendee.full_name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center">
            <span className="text-xl font-bold text-accent-500">
              {getInitials(attendee.full_name)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{attendee.full_name}</h1>
          {attendee.company && (
            <p className="text-sm text-silver/60 truncate">
              {attendee.job_title ? `${attendee.job_title} • ` : ''}
              {attendee.company}
            </p>
          )}
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-silver/60">{favoriteSessions.length} favoritos</span>
            <span className="text-xs text-silver/60">{contacts} contatos</span>
            <span className="text-xs text-silver/60">{interactions.length} interacoes</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-accent-500 text-navy-dark'
                : 'bg-white/5 text-silver/60'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badge Tab */}
      {activeTab === 'badge' && (
        <div className="flex flex-col items-center">
          <QRBadge attendee={attendee} />
          <p className="text-xs text-silver/60 mt-3 text-center">
            Apresente este QR Code no credenciamento
          </p>
        </div>
      )}

      {/* Agenda Tab */}
      {activeTab === 'agenda' && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Minha Agenda</h2>
          {favoriteSessions.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">⭐</span>
              <p className="text-sm text-silver/50">Nenhuma sessao favoritada</p>
              <button
                onClick={() => router.push('/evento/agenda')}
                className="btn-ghost text-sm mt-2"
              >
                Ver agenda completa
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {favoriteSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => router.push(`/evento/agenda/${session.id}`)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <h3 className="font-semibold text-sm text-white">{session.title}</h3>
                  <p className="text-xs text-silver/50 mt-0.5">
                    {session.speaker_name && `${session.speaker_name} • `}
                    {session.room || ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contatos Tab */}
      {activeTab === 'contatos' && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Meus Contatos</h2>
          {contacts === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">🤝</span>
              <p className="text-sm text-silver/50">Nenhum contato trocado</p>
              <button
                onClick={() => router.push('/evento/networking')}
                className="btn-ghost text-sm mt-2"
              >
                Conhecer participantes
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {interactions
                .filter((i) => i.interaction_type === 'contact_exchange')
                .map((interaction) => (
                  <div
                    key={interaction.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <p className="font-semibold text-sm text-white">
                      {(interaction.metadata as Record<string, string>)?.target_name || 'Participante'}
                    </p>
                    <p className="text-xs text-silver/50">
                      {(interaction.metadata as Record<string, string>)?.target_company || ''}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-3">
          <button
            onClick={() => router.push('/completar-perfil')}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">✏️</span>
              <span className="text-sm font-medium text-white">Editar perfil</span>
            </div>
            <svg className="w-4 h-4 text-silver/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {attendee.linkedin_url && (
            <a
              href={attendee.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💼</span>
                <span className="text-sm font-medium text-white">Meu LinkedIn</span>
              </div>
              <svg className="w-4 h-4 text-silver/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
          >
            <span className="text-lg">🚪</span>
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      )}
    </div>
  );
}
