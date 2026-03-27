'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import { createSupabaseBrowser } from '@/lib/supabase';
import { EventBanner } from '@/components/layout/EventBanner';
import { PointsBar } from '@/components/gamification/PointsBar';
import { formatTime, isSessionLive } from '@/lib/utils';
import type { EventSession, EventSponsor, EventNotification, EventMeeting } from '@/types';

export default function EventoHome() {
  const { attendee } = useAttendee();
  const { event } = useEvent();
  const [nextSession, setNextSession] = useState<EventSession | null>(null);
  const [featuredSponsors, setFeaturedSponsors] = useState<EventSponsor[]>([]);
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [nextMeeting, setNextMeeting] = useState<(EventMeeting & { sponsor?: { name: string; logo_url: string | null } }) | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_sessions')
      .select('id, title, description, speaker_name, speaker_title, speaker_photo_url, start_time, end_time, room, track, session_type')
      .eq('event_id', event.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .then(({ data, error }) => {
        if (error) { console.error('Error fetching sessions:', error); setErrorMsg('Erro ao carregar dados. Tente novamente.'); return; }
        if (data?.[0]) setNextSession(data[0] as EventSession);
      });

    supabase
      .from('event_sponsors')
      .select('id, name, logo_url, tier, tagline, segment, sort_order')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data, error }) => {
        if (error) { console.error('Error fetching sponsors:', error); return; }
        if (data) setFeaturedSponsors(data as EventSponsor[]);
      });

    supabase
      .from('event_notifications')
      .select('id, title, body, sent_at, target')
      .eq('event_id', event.id)
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (error) { console.error('Error fetching notifications:', error); return; }
        if (data) setNotifications(data as EventNotification[]);
      });

    // Fetch next meeting if attendee exists
    if (attendee) {
      supabase
        .from('event_meetings')
        .select(`
          id, event_id, attendee_id, sponsor_id, proposed_time, duration_minutes, location, status, attendee_notes, sponsor_notes,
          sponsor:event_sponsors(name, logo_url)
        `)
        .eq('attendee_id', attendee.id)
        .eq('event_id', event.id)
        .in('status', ['pending', 'confirmed'])
        .gte('proposed_time', new Date().toISOString())
        .order('proposed_time', { ascending: true })
        .limit(1)
        .then(({ data, error }) => {
          if (error) { console.error('Error fetching meetings:', error); return; }
          if (data?.[0]) setNextMeeting(data[0] as unknown as EventMeeting & { sponsor?: { name: string; logo_url: string | null } });
        });
    }
  }, [event, attendee]);

  const firstName = attendee?.full_name?.split(' ')[0] || 'Participante';

  return (
    <div className="page-container pt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ola, {firstName}! 👋</h1>
        <p className="text-sm text-silver/60">Bem-vindo ao evento</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Gamification Points Bar */}
      <div className="mb-4">
        <PointsBar eventId={event?.id} attendeeId={attendee?.id} />
      </div>

      <div className="mb-6">
        <EventBanner />
      </div>

      {/* Next Meeting */}
      {nextMeeting && (
        <div className="mb-6">
          <h2 className="section-title">Proxima reuniao</h2>
          <Link href="/evento/meus-agendamentos" className="card-hover block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📅</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {nextMeeting.sponsor?.name || 'Patrocinador'}
                </p>
                {nextMeeting.proposed_time && (
                  <p className="text-xs text-silver/60">
                    {new Date(nextMeeting.proposed_time).toLocaleString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                nextMeeting.status === 'confirmed'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {nextMeeting.status === 'confirmed' ? '✅ Confirmado' : '⏳ Pendente'}
              </span>
            </div>
          </Link>
        </div>
      )}

      {nextSession && (
        <div className="mb-6">
          <h2 className="section-title">Proxima sessao</h2>
          <Link href={`/evento/agenda/${nextSession.id}`} className="card-hover block">
            <div className="flex items-center gap-2 mb-2">
              {isSessionLive(nextSession.start_time, nextSession.end_time) && (
                <span className="badge-live">AO VIVO</span>
              )}
              <span className="text-xs text-silver/50">
                {formatTime(nextSession.start_time)} - {formatTime(nextSession.end_time)}
              </span>
              {nextSession.track && <span className="badge-track">{nextSession.track}</span>}
            </div>
            <h3 className="font-semibold text-white">{nextSession.title}</h3>
            {nextSession.speaker_name && (
              <p className="text-sm text-silver/60 mt-1">
                {nextSession.speaker_name} {nextSession.speaker_title && `· ${nextSession.speaker_title}`}
              </p>
            )}
            {nextSession.room && (
              <p className="text-xs text-silver/60 mt-1">📍 {nextSession.room}</p>
            )}
          </Link>
        </div>
      )}

      <div className="mb-6">
        <h2 className="section-title">Acesso rapido</h2>
        <div className="grid grid-cols-5 gap-2">
          {[
            { href: '/evento/agenda', icon: '📋', label: 'Agenda' },
            { href: '/evento/patrocinadores', icon: '🏢', label: 'Sponsors' },
            { href: '/evento/networking', icon: '🤝', label: 'Rede' },
            { href: '/evento/ranking', icon: '🏆', label: 'Ranking' },
            { href: '/evento/meu-perfil', icon: '📱', label: 'Meu QR' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-accent-500/30 hover:bg-accent-500/10 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium text-silver/70">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="mb-6">
          <h2 className="section-title">Avisos</h2>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className="card p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{notif.title}</p>
                    <p className="text-xs text-silver/60">{notif.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {featuredSponsors.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Patrocinadores</h2>
            <Link href="/evento/patrocinadores" className="text-sm text-accent-500 font-medium">
              Ver todos
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {featuredSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/evento/patrocinadores/${sponsor.id}`}
                className="flex-shrink-0 w-28"
              >
                <div className="card p-3 text-center">
                  <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                    {sponsor.logo_url ? (
                      <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-silver/60">{sponsor.name.charAt(0)}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-silver/80 truncate">{sponsor.name}</p>
                  <span className="text-[10px] text-silver/60 capitalize">{sponsor.tier}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
