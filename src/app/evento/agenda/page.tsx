'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { useAttendee } from '@/hooks/useAttendee';
import { AgendaCard } from '@/components/agenda/AgendaCard';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { groupSessionsByDay, formatDate } from '@/lib/utils';
import { EVENT_CONFIG } from '@/config/event';
import type { EventSession } from '@/types';

export default function AgendaPage() {
  const { event } = useEvent();
  const { attendee } = useAttendee();
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    const fetchData = async () => {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('event_sessions')
        .select('id, title, description, speaker_name, speaker_title, speaker_photo_url, start_time, end_time, room, track, session_type, sort_order')
        .eq('event_id', event.id)
        .order('start_time', { ascending: true });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        setErrorMsg('Erro ao carregar agenda. Tente novamente.');
        setLoading(false);
        return;
      }

      if (sessionsData) {
        setSessions(sessionsData as EventSession[]);
        const days = Object.keys(groupSessionsByDay(sessionsData as EventSession[]));
        if (days.length > 0 && !activeDay) {
          setActiveDay(days[0]);
        }
      }

      if (attendee) {
        const { data: favsData, error: favsError } = await supabase
          .from('event_session_favorites')
          .select('session_id')
          .eq('attendee_id', attendee.id);
        if (favsError) console.error('Error fetching favorites:', favsError);
        else if (favsData) {
          setFavorites(new Set(favsData.map((f) => f.session_id)));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [event, attendee]);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleFavorite = useCallback(
    async (sessionId: string) => {
      if (!attendee || togglingId) return;
      setTogglingId(sessionId);
      const supabase = createSupabaseBrowser();

      try {
        if (favorites.has(sessionId)) {
          // Optimistic remove
          setFavorites((prev) => {
            const next = new Set(prev);
            next.delete(sessionId);
            return next;
          });
          await supabase
            .from('event_session_favorites')
            .delete()
            .eq('attendee_id', attendee.id)
            .eq('session_id', sessionId);
        } else {
          // Optimistic add
          setFavorites((prev) => new Set(prev).add(sessionId));
          await supabase.from('event_session_favorites').insert({
            attendee_id: attendee.id,
            session_id: sessionId,
          });
        }
      } catch {
        // Revert on error — refetch favorites
        const { data } = await createSupabaseBrowser()
          .from('event_session_favorites')
          .select('session_id')
          .eq('attendee_id', attendee.id);
        if (data) setFavorites(new Set(data.map((f) => f.session_id)));
      } finally {
        setTogglingId(null);
      }
    },
    [attendee, favorites, togglingId]
  );

  if (loading) return <PageLoading />;

  const grouped = groupSessionsByDay(sessions);
  const days = Object.keys(grouped);
  const tracks = [...new Set(sessions.map((s) => s.track).filter(Boolean))] as string[];

  let filteredSessions = activeDay ? grouped[activeDay] || [] : sessions;
  if (activeTrack) {
    filteredSessions = filteredSessions.filter((s) => s.track === activeTrack);
  }

  return (
    <div className="page-container pt-4">
      <h1 className="text-xl font-bold text-white mb-4">Agenda</h1>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {days.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeDay === day
                  ? 'bg-accent-500 text-navy-dark'
                  : 'bg-white/5 text-silver/60 border border-white/10'
              }`}
            >
              Dia {i + 1} · {formatDate(day + 'T00:00:00')}
            </button>
          ))}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
          <button
            onClick={() => setActiveTrack(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !activeTrack
                ? 'bg-white text-navy'
                : 'bg-white/5 text-silver/60'
            }`}
          >
            Todas
          </button>
          {tracks.map((track) => {
            const trackConfig = EVENT_CONFIG.tracks.find((t) => t.name === track);
            return (
              <button
                key={track}
                onClick={() => setActiveTrack(activeTrack === track ? null : track)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTrack === track
                    ? 'bg-white text-navy'
                    : 'bg-white/5 text-silver/60'
                }`}
              >
                {track}
              </button>
            );
          })}
        </div>
      )}

      {filteredSessions.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Nenhuma sessao encontrada"
          description="Tente outro filtro ou dia"
        />
      ) : (
        <div className="space-y-3">
          {(filteredSessions as EventSession[]).map((session) => (
            <AgendaCard
              key={session.id}
              session={session}
              isFavorited={favorites.has(session.id)}
              onToggleFavorite={() => toggleFavorite(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
