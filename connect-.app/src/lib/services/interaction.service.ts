import { createSupabaseBrowser } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Record a sponsor interaction via server-side RPC.
 * Handles CRM deal creation atomically.
 */
export async function recordSponsorInteraction(
  eventId: string,
  attendeeId: string,
  sponsorId: string,
  interactionType: string,
  message?: string,
) {
  const supabase = createSupabaseBrowser();

  const { data, error } = await supabase.rpc('handle_sponsor_interaction_with_crm', {
    p_event_id: eventId,
    p_attendee_id: attendeeId,
    p_sponsor_id: sponsorId,
    p_interaction_type: interactionType,
    p_message: message ?? null,
  });

  if (error) {
    logger.error('Failed to record interaction', error);
    return { success: false, error };
  }

  return { success: true, data, error: null };
}

/**
 * Update meeting status via server-side RPC.
 */
export async function updateMeetingStatus(
  meetingId: string,
  status: 'confirmed' | 'cancelled',
) {
  const supabase = createSupabaseBrowser();

  const { error } = await supabase.rpc('update_meeting_status', {
    p_meeting_id: meetingId,
    p_status: status,
  });

  if (error) {
    logger.error('Failed to update meeting status', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
