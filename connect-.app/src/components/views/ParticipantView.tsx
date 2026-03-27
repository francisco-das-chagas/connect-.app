'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParticipantView } from '@/hooks/useParticipantView';
import { createSupabaseBrowser } from '@/lib/supabase';
import { formatTime } from '@/lib/utils';
import type { EventSession, EventSponsor } from '@/types';
import { Calendar, Users, Building2, MessageSquare, User, Star, StarOff, MapPin, Clock } from 'lucide-react';

type Tab = 'programacao' | 'patrocinadores' | 'networking' | 'mensagens' | 'perfil';

interface Props {
  eventId: string;
  attendeeId: string;
}

export function ParticipantView({ eventId, attendeeId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('programacao');
  const { data, loading, error } = useParticipantView(eventId, attendeeId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030816] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030816] flex items-center justify-center p-4">
        <p className="text-red-400 text-sm text-center">{error ?? 'Erro ao carregar dados.'}</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; Icon: typeof Calendar; badge?: number }[] = [
    { id: 'programacao', label: 'Agenda', Icon: Calendar },
    { id: 'patrocinadores', label: 'Expositores', Icon: Building2 },
    { id: 'networking', label: 'Networking', Icon: Users },
    { id: 'mensagens', label: 'Mensagens', Icon: MessageSquare, badge: data.unreadMessages },
    { id: 'perfil', label: 'Perfil', Icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#030816] text-white">
      {/* Header do evento */}
      <div className="border-b border-white/10 px-4 py-3">
        {data.event.banner_url && (
          <img
            src={data.event.banner_url}
            alt={data.event.name}
            className="w-full h-28 object-cover rounded-lg mb-3"
          />
        )}
        <h1 className="text-lg font-semibold">{data.event.name}</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(data.event.start_date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
          {data.event.city && ` · ${data.event.city}`}
        </p>
        {data.gamification && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
              {data.gamification.points} pts
            </span>
            <span className="text-xs text-gray-500">
              {data.gamification.visits_count} visitas · {data.gamification.interactions_count} interações
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="pb-20">
        {activeTab === 'programacao' && (
          <ProgramacaoTab sessions={data.sessions} favorites={data.favorites} attendeeId={attendeeId} />
        )}
        {activeTab === 'patrocinadores' && (
          <PatrocinadoresTab sponsors={data.sponsors} eventId={eventId} attendeeId={attendeeId} />
        )}
        {activeTab === 'networking' && (
          <div className="p-4">
            <p className="text-sm text-gray-400 mb-3">Acesse o networking completo:</p>
            <Link
              href="/evento/networking"
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Abrir Networking
            </Link>
          </div>
        )}
        {activeTab === 'mensagens' && (
          <div className="p-4">
            <p className="text-sm text-gray-400 mb-3">
              {data.unreadMessages > 0
                ? `Você tem ${data.unreadMessages} mensagem(ns) não lida(s).`
                : 'Nenhuma mensagem nova.'}
            </p>
            <Link
              href="/evento/networking"
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Abrir Chat
            </Link>
          </div>
        )}
        {activeTab === 'perfil' && (
          <div className="p-4">
            <Link
              href="/evento/meu-perfil"
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Editar Meu Perfil
            </Link>
            <Link
              href="/evento/ranking"
              className="block w-full text-center border border-white/10 text-white py-3 rounded-xl text-sm font-medium mt-3 transition-colors hover:bg-white/5"
            >
              Ver Ranking
            </Link>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-white/10 px-2 py-2 flex justify-around z-50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Programação ─── */
function ProgramacaoTab({
  sessions,
  favorites,
  attendeeId,
}: {
  sessions: EventSession[];
  favorites: string[];
  attendeeId: string;
}) {
  const [localFavorites, setLocalFavorites] = useState<string[]>(favorites);

  const toggleFavorite = useCallback(
    async (sessionId: string) => {
      const supabase = createSupabaseBrowser();
      const isFav = localFavorites.includes(sessionId);
      if (isFav) {
        await supabase
          .from('event_session_favorites')
          .delete()
          .eq('attendee_id', attendeeId)
          .eq('session_id', sessionId);
        setLocalFavorites((prev) => prev.filter((id) => id !== sessionId));
      } else {
        await supabase
          .from('event_session_favorites')
          .insert({ attendee_id: attendeeId, session_id: sessionId });
        setLocalFavorites((prev) => [...prev, sessionId]);
      }
    },
    [localFavorites, attendeeId],
  );

  const grouped = sessions.reduce(
    (acc, s) => {
      const day = new Date(s.start_time).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
      if (!acc[day]) acc[day] = [];
      acc[day].push(s);
      return acc;
    },
    {} as Record<string, EventSession[]>,
  );

  return (
    <div className="p-4 space-y-4">
      {Object.entries(grouped).map(([day, daySessions]) => (
        <div key={day}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{day}</p>
          <div className="space-y-2">
            {daySessions.map((session) => (
              <Link
                key={session.id}
                href={`/evento/agenda/${session.id}`}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3 hover:bg-white/10 transition-colors block"
              >
                <div className="w-1 rounded-full bg-cyan-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  {session.speaker_name && (
                    <p className="text-xs text-gray-400 mt-0.5">{session.speaker_name}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Clock size={12} />
                    <span>
                      {formatTime(session.start_time)} — {formatTime(session.end_time)}
                    </span>
                    {session.room && (
                      <>
                        <MapPin size={12} />
                        <span>{session.room}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(session.id);
                  }}
                  className="flex-shrink-0 text-amber-400 hover:scale-110 transition-transform"
                >
                  {localFavorites.includes(session.id) ? <Star size={20} fill="currentColor" /> : <StarOff size={20} />}
                </button>
              </Link>
            ))}
          </div>
        </div>
      ))}
      {sessions.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Nenhuma sessão disponível.</p>
      )}
    </div>
  );
}

/* ─── Patrocinadores ─── */
function PatrocinadoresTab({
  sponsors,
  eventId,
  attendeeId,
}: {
  sponsors: EventSponsor[];
  eventId: string;
  attendeeId: string;
}) {
  const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'bronze', 'support'] as const;
  const tierLabel: Record<string, string> = {
    diamond: 'Diamond',
    platinum: 'Platinum',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
    support: 'Apoio',
  };

  const grouped = tierOrder.reduce(
    (acc, tier) => {
      const list = sponsors.filter((s) => s.tier === tier);
      if (list.length) acc[tier] = list;
      return acc;
    },
    {} as Record<string, EventSponsor[]>,
  );

  const registerVisit = async (sponsorId: string) => {
    const supabase = createSupabaseBrowser();
    await supabase.from('event_interactions').insert({
      event_id: eventId,
      attendee_id: attendeeId,
      sponsor_id: sponsorId,
      interaction_type: 'booth_visit',
    });
  };

  return (
    <div className="p-4 space-y-5">
      {Object.entries(grouped).map(([tier, list]) => (
        <div key={tier}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {tierLabel[tier]}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {list.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/evento/patrocinadores/${sponsor.id}`}
                onClick={() => registerVisit(sponsor.id)}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-cyan-500/30 transition-colors"
              >
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 object-contain" />
                ) : (
                  <div className="h-10 w-full bg-white/5 rounded flex items-center justify-center text-xs text-gray-500">
                    {sponsor.name[0]}
                  </div>
                )}
                <p className="text-xs font-medium text-center leading-tight">{sponsor.name}</p>
                {sponsor.tagline && (
                  <p className="text-[10px] text-gray-500 text-center leading-tight line-clamp-2">
                    {sponsor.tagline}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
      {sponsors.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Nenhum expositor disponível.</p>
      )}
    </div>
  );
}
