import { createSupabaseBrowser } from '@/lib/supabase';
import type { EventSponsor } from '@/types';

const SPONSOR_COLUMNS = 'id, event_id, name, description, tagline, logo_url, banner_url, website_url, tier, segment, sort_order, active, contact_name, contact_email, contact_phone, instagram_url, linkedin_url, facebook_url, twitter_url, whatsapp_phone';
const SPONSOR_PUBLIC_COLUMNS = 'id, event_id, name, description, tagline, logo_url, banner_url, website_url, tier, segment, sort_order, active, instagram_url, linkedin_url, facebook_url, twitter_url, whatsapp_phone';

export async function fetchSponsors(eventId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_sponsors')
    .select(SPONSOR_PUBLIC_COLUMNS)
    .eq('event_id', eventId)
    .eq('active', true)
    .order('sort_order');
  return { sponsors: (data ?? []) as EventSponsor[], error };
}

export async function fetchSponsorById(sponsorId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_sponsors')
    .select(SPONSOR_COLUMNS)
    .eq('id', sponsorId)
    .single();
  return { sponsor: data as EventSponsor | null, error };
}

export async function fetchSponsorOffers(sponsorId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_sponsor_offers')
    .select('id, sponsor_id, title, description, offer_type, code, valid_until, max_claims, claims_count, active, created_at')
    .eq('sponsor_id', sponsorId);
  return { offers: data ?? [], error };
}
