'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useAttendee } from '@/hooks/useAttendee';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { formatDate, formatTime, isSessionLive, isSessionPast } from '@/lib/utils';
import { SESSION_TYPE_LABELS } from '@/types';
import type { EventSession } from '@/types';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { attendee } = useAttendee();
  const [session, setSession] = useState<EventSession | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    const fetchSession = async () => {
      const { data } = await supabase
        .from('event_sessions')
        .select('id, event_id, title, description, speaker_name, speaker_title, speaker_photo_url, speaker_bio, track, room, start_time, end_time, session_type, materials_url, is_featured')
        .eq('id', params.id)
        .single();

      if (data) setSession(data as EventSession);

      if (attendee) {
        const { data: fav } = await supabase
          .from('event_session_favorites')
          .select('id')
          .eq('attendee_id', attendee.id)
          .eq('session_id', params.id)
          .maybeSingle();
        setIsFavorited(!!fav);
      }

      setLoading(false);
    };

    fetchSession();
  }, [params.id, attendee]);

  const toggleFavorite = async () => {
    if (!attendee || !session) return;
    const supabase = createSupabaseBrowser();

    if (isFavorited) {
      await supabase
        .from('event_session_favorites')
        .delete()
        .eq('attendee_id', attendee.id)
        .eq('session_id', session.id);
    } else {
      await supabase.from('event_session_favorites').insert({
        attendee_id: attendee.id,
        session_id: session.id,
      });
    }
    setIsFavorited(!isFavorited);
  };

  if (loading) return <PageLoading />;
  if (!session) return <div className="page-container pt-8 text-center text-silver/50">Sessao nao encontrada</div>;

  const live = isSessionLive(session.start_time, session.end_time);
  const past = isSessionPast(session.end_time);

  return (
    <div className="page-container pt-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-silver/50 text-sm mb-4 hover:text-silver transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <div className="flex items-center gap-2 mb-3">
        {live && <span className="badge-live">AO VIVO</span>}
        {past && <span className="badge bg-white/10 text-silver/50">Encerrada</span>}
        {session.track && <span className="badge-track">{session.track}</span>}
        <span className="badge bg-white/10 text-silver/60">
          {SESSION_TYPE_LABELS[session.session_type] || session.session_type}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">{session.title}</h1>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-silver/60">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDate(session.start_time)} · {formatTime(session.start_time)} - {formatTime(session.end_time)}
        </div>
        {session.room && (
          <div className="flex items-center gap-2 text-sm text-silver/60">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {session.room}
          </div>
        )}
      </div>

      <button
        onClick={toggleFavorite}
        className={`w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-colors ${
          isFavorited
            ? 'bg-accent-500/20 text-accent-500 border-2 border-accent-500/30'
            : 'bg-white/5 text-silver/70 border-2 border-white/10'
        }`}
      >
        {isFavorited ? '⭐ Na minha agenda' : '☆ Adicionar a minha agenda'}
      </button>

      {session.speaker_name && (
        <div className="card mb-6">
          <h2 className="section-title">Palestrante</h2>
          <div className="flex items-start gap-4">
            {session.speaker_photo_url ? (
              <img
                src={session.speaker_photo_url}
                alt={session.speaker_name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-accent-500">{session.speaker_name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white">{session.speaker_name}</h3>
              {session.speaker_title && (
                <p className="text-sm text-silver/60">{session.speaker_title}</p>
              )}
              {session.speaker_bio && (
                <p className="text-sm text-silver/50 mt-2 leading-relaxed">{session.speaker_bio}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {session.description && (
        <div className="mb-6">
          <h2 className="section-title">Sobre a sessao</h2>
          <p className="text-sm text-silver/60 leading-relaxed">{session.description}</p>
        </div>
      )}

      {session.materials_url && (
        <div className="mb-6">
          <h2 className="section-title">Materiais</h2>
          <a
            href={session.materials_url}
            target="_blank"
            rel="noopener"
            className="card-hover flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm text-white">Download materiais</p>
              <p className="text-xs text-silver/50">Slides e documentos da sessao</p>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
