'use client';

import { useEffect, useRef } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtime(
  table: string,
  filter: string | undefined,
  callback: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => void
) {
  // Stabilize callback with ref to prevent re-subscribe loop
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let channel: RealtimeChannel;

    const handler = (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => {
      callbackRef.current(payload);
    };

    if (filter) {
      channel = supabase
        .channel(`${table}_${filter}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter },
          (payload) => {
            handler({
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>,
              eventType: payload.eventType,
            });
          }
        )
        .subscribe();
    } else {
      channel = supabase
        .channel(table)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            handler({
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>,
              eventType: payload.eventType,
            });
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]); // callback removed from deps — stabilized via ref
}
