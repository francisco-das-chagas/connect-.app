import { createSupabaseBrowser } from '@/lib/supabase';
import type { EventSession } from '@/types';

const SESSION_COLUMNS = 'id, event_id, title, description, speaker_name, speaker_title, speaker_photo_url, speaker_bio, track, room, start_time, end_time, session_type, max_capacity, materials_url, is_featured, sort_order, created_at';

export async function fetchSessions(eventId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_sessions')
    .select(SESSION_COLUMNS)
    .eq('event_id', eventId)
    .order('start_time');
  return { sessions: (data ?? []) as EventSession[], error };
}

export async function fetchSessionById(sessionId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from('event_sessions')
    .select(SESSION_COLUMNS)
    .eq('id', sessionId)
    .single();
  return { session: data as EventSession | null, error };
}

export async function fetchFavorites(attendeeId: string) {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase
    .from('event_session_favorites')
    .select('session_id')
    .eq('attendee_id', attendeeId);
  return new Set((data ?? []).map((f) => f.session_id));
}
