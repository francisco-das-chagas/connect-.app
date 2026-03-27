'use client';

import { useState } from 'react';
import { handleSponsorInteraction } from '@/lib/crm-integration';
import { awardPoints } from '@/lib/gamification';
import { useEvent } from '@/hooks/useEvent';
import { sanitizeText, MAX_LENGTHS } from '@/lib/sanitize';
import type { EventAttendee, EventSponsor } from '@/types';

interface LeadCaptureProps {
  attendee: EventAttendee;
  sponsor: EventSponsor;
  onSuccess?: () => void;
}

// Lead capture form — collects interest + notes, creates interaction + CRM deal
export function LeadCapture({ attendee, sponsor, onSuccess }: LeadCaptureProps) {
  const { event } = useEvent();
  const [interest, setInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setLoading(true);

    try {
      // Use handleSponsorInteraction to create interaction + CRM deal
      const sanitizedNotes = sanitizeText(notes, MAX_LENGTHS.mediumText);
      await handleSponsorInteraction({
        event_id: event.id,
        attendee_id: attendee.id,
        sponsor_id: sponsor.id,
        interaction_type: 'contact_request',
        message: [
          `Interesse: ${interest}`,
          sanitizedNotes ? `Obs: ${sanitizedNotes}` : '',
        ].filter(Boolean).join('\n'),
      });

      // Award gamification points
      await awardPoints(event.id, attendee.id, 'contact_request');

      setDone(true);
      onSuccess?.();
    } catch (err) {
      console.error('Lead capture error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-semibold text-white">Interesse registrado!</p>
        <p className="text-sm text-silver/50 mt-1">
          {sponsor.name} entrara em contato em breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-silver/60 mb-1">
          Area de interesse
        </label>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none appearance-none"
          required
        >
          <option value="" className="bg-navy text-silver">Selecione...</option>
          <option value="produto" className="bg-navy text-white">Conhecer produtos/servicos</option>
          <option value="demo" className="bg-navy text-white">Agendar demonstracao</option>
          <option value="parceria" className="bg-navy text-white">Parceria comercial</option>
          <option value="cotacao" className="bg-navy text-white">Solicitar cotacao</option>
          <option value="outro" className="bg-navy text-white">Outro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-silver/60 mb-1">
          Observacoes (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-silver/30 focus:border-accent-500/50 focus:outline-none min-h-[80px] resize-none"
          placeholder="Conte um pouco mais sobre seu interesse..."
          maxLength={MAX_LENGTHS.mediumText}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !interest}
        className="btn-primary w-full"
      >
        {loading ? 'Enviando...' : '💬 Enviar interesse'}
      </button>
    </form>
  );
}
