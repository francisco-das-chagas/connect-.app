'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { EVENT_CONFIG } from '@/config/event';
import type { Event } from '@/types';

export function useEvent() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from('events')
        .select('id, name, slug, description, start_date, end_date, location, address, city, uf, banner_url, logo_url, max_attendees, registration_open, status, config, created_at, updated_at')
        .eq('slug', EVENT_CONFIG.slug)
        .single();

      if (!error && data) {
        setEvent(data as Event);
      }
      setLoading(false);
    };

    fetchEvent();
  }, []);

  return { event, loading };
}
