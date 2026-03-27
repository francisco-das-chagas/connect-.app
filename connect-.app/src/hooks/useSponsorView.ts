'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import type { Event, EventSponsor, EventSponsorOffer } from '@/types';

interface LeadEntry {
  id: string;
  interaction_type: string;
  created_at: string;
  attendee: {
    id: string;
    full_name: string;
    email: string;
    company: string | null;
    job_title: string | null;
    photo_url: string | null;
    linkedin_url: string | null;
  } | null;
}

interface MeetingEntry {
  id: string;
  proposed_time: string | null;
  duration_minutes: number;
  location: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  attendee_notes: string | null;
  sponsor_notes: string | null;
  created_at: string;
  attendee: {
    full_name: string;
    email: string;
    company: string | null;
    photo_url: string | null;
  } | null;
}

interface SponsorMetrics {
  totalVisits: number;
  totalLeads: number;
  offersClaimed: number;
  meetingsConfirmed: number;
}

interface SponsorViewData {
  sponsor: EventSponsor;
  event: Event;
  leads: LeadEntry[];
  offers: EventSponsorOffer[];
  meetings: MeetingEntry[];
  metrics: SponsorMetrics;
}

export function useSponsorView(eventId: string | undefined, sponsorId: string | undefined) {
  const [data, setData] = useState<SponsorViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !sponsorId) return;
    setLoading(true);

    const supabase = createSupabaseBrowser();

    Promise.all([
      supabase
        .from('event_sponsors')
        .select('id, event_id, name, description, tagline, logo_url, banner_url, website_url, tier, contact_name, contact_email, contact_phone, segment, sort_order, active, instagram_url, linkedin_url, facebook_url, twitter_url, whatsapp_phone')
        .eq('id', sponsorId)
        .single(),
      supabase
        .from('events')
        .select('id, name, slug, description, start_date, end_date, location, city, uf, banner_url, logo_url, status, created_at, updated_at, registration_open, max_attendees, address, config')
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_interactions')
        .select('id, interaction_type, created_at, attendee:event_attendees!attendee_id(id, full_name, email, company, job_title, photo_url, linkedin_url)')
        .eq('sponsor_id', sponsorId)
        .eq('interaction_type', 'booth_visit')
        .order('created_at', { ascending: false }),
      supabase
        .from('event_sponsor_offers')
        .select('id, sponsor_id, title, description, offer_type, code, valid_until, max_claims, claims_count, active, created_at')
        .eq('sponsor_id', sponsorId),
      supabase
        .from('event_meetings')
        .select('id, proposed_time, duration_minutes, location, status, attendee_notes, sponsor_notes, created_at, attendee:event_attendees!attendee_id(full_name, email, company, photo_url)')
        .eq('sponsor_id', sponsorId)
        .order('proposed_time', { ascending: true }),
      supabase
        .from('event_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('sponsor_id', sponsorId),
    ])
      .then(([sponsorRes, eventRes, leadsRes, offersRes, meetingsRes, totalVisitsRes]) => {
        if (sponsorRes.error || eventRes.error) {
          setError('Erro ao carregar dados do patrocinador.');
          setLoading(false);
          return;
        }

        const offersClaimed = (offersRes.data ?? []).reduce(
          (acc: number, o: { claims_count?: number }) => acc + (o.claims_count ?? 0),
          0,
        );
        const meetingsConfirmed = (meetingsRes.data ?? []).filter(
          (m: { status: string }) => m.status === 'confirmed',
        ).length;

        setData({
          sponsor: sponsorRes.data as unknown as EventSponsor,
          event: eventRes.data as Event,
          leads: (leadsRes.data ?? []) as unknown as LeadEntry[],
          offers: (offersRes.data ?? []) as EventSponsorOffer[],
          meetings: (meetingsRes.data ?? []) as unknown as MeetingEntry[],
          metrics: {
            totalVisits: totalVisitsRes.count ?? 0,
            totalLeads: (leadsRes.data ?? []).length,
            offersClaimed,
            meetingsConfirmed,
          },
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Erro de conexão.');
        setLoading(false);
      });
  }, [eventId, sponsorId]);

  return { data, loading, error };
}
