'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase';
import { GAMIFICATION_BADGES } from '@/types';
import type { EventGamification } from '@/types';

interface PointsBarProps {
  eventId: string | undefined;
  attendeeId: string | undefined;
}

export function PointsBar({ eventId, attendeeId }: PointsBarProps) {
  const [gamification, setGamification] = useState<EventGamification | null>(null);

  useEffect(() => {
    if (!eventId || !attendeeId) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_gamification')
      .select('id, event_id, attendee_id, points, visits_count, interactions_count, offers_claimed, badges, updated_at')
      .eq('event_id', eventId)
      .eq('attendee_id', attendeeId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error('Error fetching gamification:', error); return; }
        if (data) setGamification(data as EventGamification);
      });
  }, [eventId, attendeeId]);

  if (!gamification) return null;

  const badges = gamification.badges || [];
  const earnedBadges = GAMIFICATION_BADGES.filter((b) => badges.includes(b.id));
  const nextBadge = GAMIFICATION_BADGES.find((b) => !badges.includes(b.id));

  // Progress to next badge
  const progress = nextBadge
    ? Math.min(100, Math.round(((gamification[nextBadge.field as keyof EventGamification] as number) / nextBadge.threshold) * 100))
    : 100;

  return (
    <Link href="/evento/ranking" className="block">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-accent-500/10 to-purple-500/10 border border-accent-500/20">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">⭐</span>
          <span className="font-bold text-white text-sm">{gamification.points}</span>
          <span className="text-[10px] text-silver/50">pts</span>
        </div>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {nextBadge && (
            <p className="text-[9px] text-silver/60 mt-0.5">
              Proximo: {nextBadge.icon} {nextBadge.name}
            </p>
          )}
        </div>

        {/* Earned badges */}
        <div className="flex -space-x-1">
          {earnedBadges.slice(0, 3).map((badge) => (
            <span key={badge.id} className="text-sm" title={badge.name}>
              {badge.icon}
            </span>
          ))}
          {earnedBadges.length > 3 && (
            <span className="text-[10px] text-silver/50 ml-1">+{earnedBadges.length - 3}</span>
          )}
        </div>

        <svg className="w-4 h-4 text-silver/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
