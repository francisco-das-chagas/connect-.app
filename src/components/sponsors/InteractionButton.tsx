'use client';

import { useState } from 'react';
import { handleSponsorInteraction } from '@/lib/crm-integration';
import { awardPoints } from '@/lib/gamification';
import { useEvent } from '@/hooks/useEvent';
import { sanitizeText, MAX_LENGTHS } from '@/lib/sanitize';
import type { EventAttendee, EventSponsor } from '@/types';

interface InteractionButtonProps {
  attendee: EventAttendee | null;
  sponsor: EventSponsor;
  interactionType: 'visit' | 'material_download' | 'contact_request' | 'meeting_request';
  label: string;
  icon?: string;
  className?: string;
}

export function InteractionButton({
  attendee,
  sponsor,
  interactionType,
  label,
  icon = '✨',
  className = '',
}: InteractionButtonProps) {
  const { event } = useEvent();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  const handleSend = async (msg?: string) => {
    if (!attendee || !event || done) return;
    setLoading(true);

    try {
      const sanitizedMsg = msg ? sanitizeText(msg, MAX_LENGTHS.mediumText) : undefined;
      await handleSponsorInteraction({
        event_id: event.id,
        attendee_id: attendee.id,
        sponsor_id: sponsor.id,
        interaction_type: interactionType,
        message: sanitizedMsg || undefined,
      });
      // Award gamification points
      await awardPoints(event.id, attendee.id, interactionType);

      setDone(true);
      setShowModal(false);
    } catch (err) {
      console.error('Interaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!attendee || !event || done) return;
    // Open modal for meeting_request to collect message
    if (interactionType === 'meeting_request') {
      setShowModal(true);
    } else {
      handleSend();
    }
  };

  if (done) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-green-500/20 border border-green-500/30 text-green-400 font-semibold text-sm ${className}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        {interactionType === 'meeting_request' ? 'Reuniao solicitada!' : 'Solicitado!'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || !attendee}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors disabled:opacity-50 ${className}`}
      >
        {loading && !showModal ? (
          <div className="w-5 h-5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
        ) : (
          <span>{icon}</span>
        )}
        {loading && !showModal ? 'Enviando...' : label}
      </button>

      {/* Modal for meeting request with message */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-navy-light rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-lg">📅 Agendar reuniao</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-silver/60 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-silver/60 mb-4">
                Envie uma mensagem para <span className="text-white font-medium">{sponsor.name}</span> sobre o que gostaria de conversar.
              </p>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-silver/30 focus:border-accent-500/50 focus:outline-none resize-none min-h-[100px]"
                placeholder="Ex: Gostaria de conhecer mais sobre seus servicos de IA para PMEs..."
                maxLength={MAX_LENGTHS.mediumText}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-silver/70 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSend(message)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  ) : (
                    <span>📅</span>
                  )}
                  {loading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
