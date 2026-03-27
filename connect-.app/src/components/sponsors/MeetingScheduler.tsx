'use client';

import { useState } from 'react';
import { handleSponsorInteraction } from '@/lib/crm-integration';
import { awardPoints } from '@/lib/gamification';
import { useEvent } from '@/hooks/useEvent';
import { sanitizeText, MAX_LENGTHS } from '@/lib/sanitize';
import type { EventAttendee, EventSponsor } from '@/types';

interface MeetingSchedulerProps {
  attendee: EventAttendee | null;
  sponsor: EventSponsor;
  className?: string;
}

export function MeetingScheduler({ attendee, sponsor, className = '' }: MeetingSchedulerProps) {
  const { event } = useEvent();
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleInterest = async () => {
    if (!attendee || !event) return;
    setLoading(true);

    try {
      // Create CRM interaction (meeting_request type)
      await handleSponsorInteraction({
        event_id: event.id,
        attendee_id: attendee.id,
        sponsor_id: sponsor.id,
        interaction_type: 'meeting_request',
        message: notes ? sanitizeText(notes, MAX_LENGTHS.mediumText) : undefined,
      });

      // Award gamification points
      await awardPoints(event.id, attendee.id, 'meeting_request');

      setDone(true);
    } catch (err) {
      console.error('Meeting interest error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={`rounded-2xl bg-green-500/10 border border-green-500/20 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <p className="text-sm font-semibold text-green-400">Interesse registrado!</p>
        </div>
        <p className="text-xs text-silver/50 ml-7">
          O patrocinador entrara em contato com voce.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showNotes && (
        <div className="mb-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-silver/30 focus:border-accent-500/50 focus:outline-none resize-none min-h-[60px]"
            placeholder="Sobre o que gostaria de conversar? (opcional)"
            maxLength={MAX_LENGTHS.mediumText}
          />
        </div>
      )}
      <div className="flex gap-2">
        {!showNotes && (
          <button
            onClick={() => setShowNotes(true)}
            className="px-3 py-3 rounded-2xl bg-white/5 border border-white/10 text-silver/60 text-xs hover:bg-white/10 transition-colors"
            title="Adicionar nota"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
        )}
        <button
          onClick={handleInterest}
          disabled={loading || !attendee}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-purple-500 text-white font-semibold text-sm hover:bg-purple-400 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>🤝</span>
          )}
          {loading ? 'Registrando...' : 'Tenho interesse em reuniao'}
        </button>
      </div>
    </div>
  );
}
