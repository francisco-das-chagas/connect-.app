'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import type { EventAttendee } from '@/types';

interface ContactExchangeProps {
  myAttendee: EventAttendee;
  otherAttendee: EventAttendee;
}

export function ContactExchange({ myAttendee, otherAttendee }: ContactExchangeProps) {
  const { event } = useEvent();
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase
      .from('event_interactions')
      .select('id')
      .eq('attendee_id', myAttendee.id)
      .eq('interaction_type', 'contact_exchange')
      .eq('metadata->>target_attendee_id', otherAttendee.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('Error checking contact exchange:', error); return; }
        if (data) setShared(true);
      });
  }, [myAttendee.id, otherAttendee.id]);

  const handleExchange = async () => {
    if (shared || loading) return;
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      await supabase.from('event_interactions').insert([
        {
          event_id: event?.id,
          attendee_id: myAttendee.id,
          interaction_type: 'contact_exchange',
          metadata: {
            target_attendee_id: otherAttendee.id,
            target_name: otherAttendee.full_name,
            target_company: otherAttendee.company,
          },
        },
      ]);
      setShared(true);
    } catch (err) {
      console.error('Contact exchange error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (shared) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/20 border border-green-500/30">
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="text-sm font-medium text-green-400">Contato trocado</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleExchange}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      )}
      {loading ? 'Trocando...' : 'Trocar contato'}
    </button>
  );
}
