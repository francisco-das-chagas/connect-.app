'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { EventAttendee } from '@/types';

export function useAttendee() {
  const { user, loading: authLoading } = useAuth();
  const [attendee, setAttendee] = useState<EventAttendee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish before deciding
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    // Reset loading when starting a new fetch
    setLoading(true);

    let cancelled = false;

    const ATTENDEE_COLS = 'id, event_id, party_id, user_id, full_name, email, cpf, phone, company, job_title, photo_url, avatar_url, bio, linkedin_url, badge_code, ticket_type, checked_in, checked_in_at, networking_visible, networking_opt_in, interests, status, source, created_at, updated_at';

    const fetchAttendee = async () => {
      try {
        const supabase = createSupabaseBrowser();

        // 1. Try by user_id first (normal flow)
        let { data, error } = await supabase
          .from('event_attendees')
          .select(ATTENDEE_COLS)
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. Fallback: find pre-seeded attendee by email and link user_id
        if (!data && user.email) {
          const { data: preSeeded } = await supabase
            .from('event_attendees')
            .select(ATTENDEE_COLS)
            .eq('email', user.email)
            .is('user_id', null)
            .maybeSingle();

          if (preSeeded) {
            // Link the auth user to the pre-seeded attendee
            const { error: linkError } = await supabase
              .from('event_attendees')
              .update({ user_id: user.id })
              .eq('id', preSeeded.id)
              .is('user_id', null);

            if (!linkError) {
              data = { ...preSeeded, user_id: user.id };
            }
          }
        }

        if (cancelled) return;

        if (!error && data) {
          setAttendee(data as EventAttendee);
        } else if (error) {
          console.warn('Failed to fetch attendee:', error.message);
          setAttendee(null);
        }
      } catch (err) {
        console.warn('Attendee fetch error:', err);
        if (!cancelled) {
          setAttendee(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAttendee();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { attendee, loading, setAttendee };
}
