'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { useAuth } from '@/hooks/useAuth';
import { useAttendee } from '@/hooks/useAttendee';
import { usePresence } from '@/hooks/usePresence';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { ChatWindow } from '@/components/networking/ChatWindow';
import { ContactExchange } from '@/components/networking/ContactExchange';
import { getInitials, getShortName } from '@/lib/utils';
import type { EventAttendee } from '@/types';

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { event } = useEvent();
  const { user } = useAuth();
  const { attendee: myAttendee } = useAttendee();
  const [otherAttendee, setOtherAttendee] = useState<EventAttendee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  // Determine sender type for presence
  const isSponsor = myAttendee?.ticket_type === 'sponsor';
  const senderType: 'participante' | 'patrocinador' = isSponsor ? 'patrocinador' : 'participante';

  // Presence: track myself and check if other is online
  const { isOnline } = usePresence({
    eventId: event?.id || '',
    attendeeId: myAttendee?.id || '',
    name: myAttendee ? getShortName(myAttendee.full_name) : '',
    type: senderType,
    enabled: !!event?.id && !!myAttendee?.id,
  });

  const otherIsOnline = id ? isOnline(id) : false;

  useEffect(() => {
    if (!id) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_attendees')
      .select('id, full_name, company, job_title, avatar_url, linkedin_url, interests, ticket_type')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setOtherAttendee(data as EventAttendee);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoading />;

  if (!otherAttendee || !user || !event || !myAttendee) {
    return (
      <div className="page-container pt-4 text-center">
        <p className="text-silver/50">Participante nao encontrado</p>
        <button onClick={() => router.back()} className="btn-ghost mt-4">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-navy-light">
        <button onClick={() => router.back()} className="p-1" aria-label="Voltar">
          <svg className="w-5 h-5 text-silver/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-3 flex-1"
        >
          <div className="relative">
            {otherAttendee.avatar_url ? (
              <img
                src={otherAttendee.avatar_url}
                alt={otherAttendee.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-accent-500">
                  {getInitials(otherAttendee.full_name)}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-navy-light ${
                otherIsOnline ? 'bg-green-400' : 'bg-silver/30'
              }`}
            />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-sm text-white">{otherAttendee.full_name}</h2>
            <p className={`text-xs ${otherIsOnline ? 'text-green-400' : 'text-silver/60'}`}>
              {otherIsOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </button>
      </div>

      {/* Offline banner - shows when other user is not online */}
      {!otherIsOnline && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-300">
            <span className="font-semibold">{getShortName(otherAttendee.full_name)}</span> esta offline. Pode nao ver sua mensagem imediatamente.
          </p>
        </div>
      )}

      {/* Profile Panel (toggle) */}
      {showProfile && (
        <div className="px-4 py-4 border-b border-white/10 bg-white/5 space-y-3">
          {otherAttendee.job_title && (
            <p className="text-sm text-silver/60">
              <span className="font-medium text-silver">Cargo:</span> {otherAttendee.job_title}
            </p>
          )}
          {otherAttendee.linkedin_url && (
            <a
              href={otherAttendee.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-500 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </a>
          )}
          {otherAttendee.interests && otherAttendee.interests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-silver/50 mb-1">Interesses:</p>
              <div className="flex flex-wrap gap-1">
                {otherAttendee.interests.map((i: string) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      myAttendee.interests?.includes(i)
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-silver/50'
                    }`}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ContactExchange myAttendee={myAttendee} otherAttendee={otherAttendee} />
        </div>
      )}

      {/* Chat Messages - always enabled, even when other is offline */}
      <ChatWindow
        currentUserId={myAttendee.id}
        otherUserId={otherAttendee.id}
        eventId={event.id}
      />
    </div>
  );
}
