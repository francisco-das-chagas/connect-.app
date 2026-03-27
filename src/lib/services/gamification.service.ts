import { createSupabaseBrowser } from '@/lib/supabase';
import { logger } from '@/lib/logger';
type GamificationAction = 'booth_visit' | 'contact_request' | 'meeting_request' | 'offer_claim' | 'session_favorite' | 'qr_scan';

/**
 * Award points for a gamification action via server-side RPC.
 * Returns updated gamification stats.
 */
export async function awardPoints(
  eventId: string,
  attendeeId: string,
  action: GamificationAction,
) {
  const supabase = createSupabaseBrowser();

  const { data, error } = await supabase.rpc('award_gamification_points', {
    p_event_id: eventId,
    p_attendee_id: attendeeId,
    p_action: action,
  });

  if (error) {
    logger.error('Failed to award points', error);
    return { success: false, data: null, error };
  }

  // Check and award badges based on updated stats
  const stats = data as {
    points: number;
    visits_count: number;
    interactions_count: number;
    offers_claimed: number;
    badges: string[];
  };

  const newBadges: string[] = [];
  const currentBadges = stats.badges ?? [];

  if (stats.visits_count >= 5 && !currentBadges.includes('explorer')) {
    newBadges.push('explorer');
  }
  if (stats.interactions_count >= 3 && !currentBadges.includes('networker')) {
    newBadges.push('networker');
  }
  if (stats.points >= 50 && !currentBadges.includes('vip')) {
    newBadges.push('vip');
  }
  if (stats.offers_claimed >= 3 && !currentBadges.includes('collector')) {
    newBadges.push('collector');
  }
  if (stats.points >= 100 && !currentBadges.includes('champion')) {
    newBadges.push('champion');
  }

  if (newBadges.length > 0) {
    const { error: badgeError } = await supabase.rpc('award_gamification_badges', {
      p_event_id: eventId,
      p_attendee_id: attendeeId,
      p_new_badges: newBadges,
    });
    if (badgeError) {
      logger.error('Failed to award badges', badgeError);
    }
  }

  return { success: true, data: stats, newBadges, error: null };
}
