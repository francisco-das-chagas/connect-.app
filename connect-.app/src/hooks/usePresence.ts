'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';

interface PresenceUser {
  attendee_id: string;
  name: string;
  type: 'participante' | 'patrocinador';
}

interface UsePresenceOptions {
  eventId: string;
  attendeeId: string;
  name: string;
  type: 'participante' | 'patrocinador';
  enabled?: boolean;
}

export function usePresence({ eventId, attendeeId, name, type, enabled = true }: UsePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map());
  const channelRef = useRef<any>(null);
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  useEffect(() => {
    if (!enabled || !eventId || !attendeeId) return;

    const channelName = `networking-presence-${eventId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = new Map<string, PresenceUser>();

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p: PresenceUser) => {
            if (p.attendee_id && p.attendee_id !== attendeeId) {
              users.set(p.attendee_id, {
                attendee_id: p.attendee_id,
                name: p.name,
                type: p.type,
              });
            }
          });
        });

        setOnlineUsers(users);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            attendee_id: attendeeId,
            name,
            type,
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [eventId, attendeeId, name, type, enabled, supabase]);

  const isOnline = useCallback(
    (id: string) => onlineUsers.has(id),
    [onlineUsers]
  );

  const onlineCount = onlineUsers.size;

  return { onlineUsers, isOnline, onlineCount };
}
