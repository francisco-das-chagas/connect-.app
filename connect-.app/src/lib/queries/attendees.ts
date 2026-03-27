import { createSupabaseBrowser } from '@/lib/supabase';
import type { EventAttendee } from '@/types';

const ATTENDEE_COLUMNS = 'id, event_id, user_id, full_name, email, phone, company, job_title, photo_url, avatar_url, bio, linkedin_url, badge_code, ticket_type, checked_in, checked_in_at, networking_visible, networking_opt_in, interests, status, source, created_at, updated_at';
const ATTENDEE_PUBLIC_COLUMNS = 'id, event_id, full_name, company, job_title, photo_url, avatar_url, bio, linkedin_url, ticket_type, networking_visible, interests';

export async function fetchAttendeeByUserId(eventId: string, userId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_attendees')
    .select(ATTENDEE_COLUMNS)
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();
  return { attendee: data as EventAttendee | null, error };
}

export async function fetchNetworkingAttendees(eventId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_attendees')
    .select(ATTENDEE_PUBLIC_COLUMNS)
    .eq('event_id', eventId)
    .eq('networking_visible', true)
    .eq('status', 'confirmed')
    .order('full_name');
  return { attendees: (data ?? []) as Partial<EventAttendee>[], error };
}

export async function fetchAttendeeByBadge(eventId: string, badgeCode: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_attendees')
    .select(ATTENDEE_COLUMNS)
    .eq('event_id', eventId)
    .eq('badge_code', badgeCode)
    .single();
  return { attendee: data as EventAttendee | null, error };
}
