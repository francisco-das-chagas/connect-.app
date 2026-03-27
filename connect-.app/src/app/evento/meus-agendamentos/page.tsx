'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import type { EventMeeting, EventSponsor } from '@/types';

export default function MeusAgendamentosPage() {
  const router = useRouter();
  const { attendee } = useAttendee();
  const { event } = useEvent();
  const [meetings, setMeetings] = useState<(EventMeeting & { sponsor: EventSponsor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!attendee || !event) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_meetings')
      .select(`
        id, event_id, attendee_id, sponsor_id, proposed_time, duration_minutes, location, status, attendee_notes, sponsor_notes, created_at,
        sponsor:event_sponsors(id, name, logo_url, tier, contact_name)
      `)
      .eq('attendee_id', attendee.id)
      .eq('event_id', event.id)
      .order('proposed_time', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('Error fetching meetings:', error); setErrorMsg('Erro ao carregar agendamentos.'); }
        else if (data) setMeetings(data as unknown as (EventMeeting & { sponsor: EventSponsor })[]);
        setLoading(false);
      });
  }, [attendee, event]);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
  };

  const statusIcons: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    cancelled: '❌',
  };

  return (
    <div className="page-container pt-4 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-silver/50 text-sm mb-4 hover:text-silver transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">📅 Meus agendamentos</h1>
      <p className="text-sm text-silver/60 mb-6">Reunioes agendadas com patrocinadores</p>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📅</span>
          <p className="text-silver/50 text-sm">Nenhuma reuniao agendada ainda.</p>
          <p className="text-silver/30 text-xs mt-1 mb-4">
            Visite os patrocinadores para agendar reunioes.
          </p>
          <Link href="/evento/patrocinadores" className="btn-primary inline-block">
            Ver patrocinadores
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {meeting.sponsor?.logo_url ? (
                    <img
                      src={meeting.sponsor.logo_url}
                      alt={meeting.sponsor.name}
                      className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
                      <span className="font-bold text-accent-500">{meeting.sponsor?.name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-sm truncate">
                      {meeting.sponsor?.name || 'Patrocinador'}
                    </p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${statusColors[meeting.status]}`}>
                      {statusIcons[meeting.status]} {statusLabels[meeting.status]}
                    </span>
                  </div>
                  {meeting.proposed_time && (
                    <p className="text-sm text-silver/70 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-silver/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(meeting.proposed_time).toLocaleString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <span className="text-silver/60">({meeting.duration_minutes}min)</span>
                    </p>
                  )}
                  {meeting.location && (
                    <p className="text-xs text-silver/50 mt-1">📍 {meeting.location}</p>
                  )}
                  {meeting.attendee_notes && (
                    <p className="text-xs text-silver/50 mt-1 bg-white/5 p-2 rounded-lg">
                      {meeting.attendee_notes}
                    </p>
                  )}
                  {meeting.sponsor_notes && (
                    <p className="text-xs text-purple-400/70 mt-1 bg-purple-500/5 p-2 rounded-lg">
                      Nota do patrocinador: {meeting.sponsor_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
