import { createSupabaseBrowser } from './supabase';
import { GAMIFICATION_BADGES } from '@/types';
import type { EventGamification } from '@/types';

/**
 * Award points to an attendee after an action.
 * Uses a SECURITY DEFINER server-side function for atomic increment.
 * This prevents client-side manipulation of points.
 */
export async function awardPoints(
  eventId: string,
  attendeeId: string,
  action: string
) {
  const supabase = createSupabaseBrowser();

  // Call the secure server-side function
  const { data: result, error } = await supabase.rpc('award_gamification_points', {
    p_event_id: eventId,
    p_attendee_id: attendeeId,
    p_action: action,
  });

  if (error) {
    console.error('Gamification RPC error:', error);
    return null;
  }

  if (!result?.success) {
    console.warn('Gamification failed:', result?.error);
    return null;
  }

  // Check badges client-side (read-only check for UI feedback only)
  const newBadges = checkBadgesFromResult(result, result.badges || []);

  // Award badges server-side via RPC (never UPDATE directly from client)
  if (newBadges.length > 0) {
    const { error: badgeError } = await supabase.rpc('award_gamification_badges', {
      p_event_id: eventId,
      p_attendee_id: attendeeId,
      p_new_badges: newBadges,
    });

    if (badgeError) {
      console.error('Badge RPC error:', badgeError);
    }
  }

  return { data: result, newBadges };
}

/**
 * Check which badges should be awarded based on RPC result stats.
 */
function checkBadgesFromResult(
  stats: { points?: number; visits_count?: number; interactions_count?: number; offers_claimed?: number },
  currentBadges: string[]
): string[] {
  const newBadges: string[] = [];

  for (const badge of GAMIFICATION_BADGES) {
    if (currentBadges.includes(badge.id)) continue;

    let value = 0;
    if (badge.field === 'points') value = stats.points || 0;
    else if (badge.field === 'visits_count') value = stats.visits_count || 0;
    else if (badge.field === 'interactions_count') value = stats.interactions_count || 0;
    else if (badge.field === 'offers_claimed') value = stats.offers_claimed || 0;

    if (value >= badge.threshold) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

/**
 * Get leaderboard for an event.
 * Uses specific field selection instead of select('*') to avoid data leaks.
 */
export async function getLeaderboard(eventId: string, limit = 20) {
  const supabase = createSupabaseBrowser();

  const { data } = await supabase
    .from('event_gamification')
    .select(`
      id, attendee_id, points, visits_count, interactions_count, offers_claimed, badges,
      attendee:event_attendees(id, full_name, company, photo_url, avatar_url)
    `)
    .eq('event_id', eventId)
    .order('points', { ascending: false })
    .limit(limit);

  return data || [];
}
