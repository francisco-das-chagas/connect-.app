'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import type { Event, EventSession, EventSponsor } from '@/types';

interface ParticipantViewData {
  event: Event;
  sessions: EventSession[];
  sponsors: EventSponsor[];
  favorites: string[];
  gamification: {
    points: number;
    visits_count: number;
    interactions_count: number;
    offers_claimed: number;
    badges: unknown[];
  } | null;
  unreadMessages: number;
}

export function useParticipantView(eventId: string | undefined, attendeeId: string | undefined) {
  const [data, setData] = useState<ParticipantViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !attendeeId) return;
    setLoading(true);

    const supabase = createSupabaseBrowser();

    Promise.all([
      supabase
        .from('events')
        .select('id, name, slug, description, start_date, end_date, location, address, city, uf, banner_url, logo_url, max_attendees, registration_open, status, config, created_at, updated_at')
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_sessions')
        .select('id, event_id, title, description, speaker_name, speaker_title, speaker_photo_url, speaker_bio, track, room, start_time, end_time, session_type, max_capacity, materials_url, is_featured, sort_order, created_at')
        .eq('event_id', eventId)
        .order('start_time'),
      supabase
        .from('event_sponsors')
        .select('id, event_id, name, description, tagline, logo_url, banner_url, website_url, tier, segment, sort_order, active, instagram_url, linkedin_url, facebook_url, twitter_url, whatsapp_phone')
        .eq('event_id', eventId)
        .eq('active', true)
        .order('sort_order'),
      supabase
        .from('event_session_favorites')
        .select('session_id')
        .eq('attendee_id', attendeeId),
      supabase
        .from('event_gamification')
        .select('points, visits_count, interactions_count, offers_claimed, badges')
        .eq('attendee_id', attendeeId)
        .eq('event_id', eventId)
        .single(),
      supabase
        .from('event_messages')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('receiver_id', attendeeId)
        .is('read_at', null),
    ])
      .then(([eventRes, sessionsRes, sponsorsRes, favoritesRes, gamificationRes, unreadRes]) => {
        if (eventRes.error) {
          setError('Erro ao carregar evento.');
          setLoading(false);
          return;
        }
        setData({
          event: eventRes.data as Event,
          sessions: (sessionsRes.data ?? []) as EventSession[],
          sponsors: (sponsorsRes.data ?? []) as EventSponsor[],
          favorites: favoritesRes.data?.map((f) => f.session_id) ?? [],
          gamification: gamificationRes.data ?? null,
          unreadMessages: unreadRes.count ?? 0,
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Erro de conexão.');
        setLoading(false);
      });
  }, [eventId, attendeeId]);

  return { data, loading, error };
}
