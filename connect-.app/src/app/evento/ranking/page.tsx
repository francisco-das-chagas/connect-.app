'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import { getLeaderboard } from '@/lib/gamification';
import { createSupabaseBrowser } from '@/lib/supabase';
import { GAMIFICATION_BADGES } from '@/types';
import type { EventGamification } from '@/types';

// Matches the specific fields returned by getLeaderboard (select-specific, not select *)
interface LeaderboardEntry {
  id: string;
  points: number;
  visits_count: number;
  interactions_count: number;
  offers_claimed: number;
  badges: string[];
  attendee_id?: string;
  attendee?: {
    id: string;
    full_name: string;
    company: string | null;
    photo_url: string | null;
    avatar_url: string | null;
  };
}

export default function RankingPage() {
  const router = useRouter();
  const { attendee } = useAttendee();
  const { event } = useEvent();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<EventGamification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;

    const fetchData = async () => {
      try {
        const data = await getLeaderboard(event.id, 20);
        setLeaderboard(data as unknown as LeaderboardEntry[]);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      }

      if (attendee) {
        const supabase = createSupabaseBrowser();
        const { data: myData, error: myError } = await supabase
          .from('event_gamification')
          .select('id, attendee_id, points, visits_count, interactions_count, offers_claimed, badges')
          .eq('event_id', event.id)
          .eq('attendee_id', attendee.id)
          .maybeSingle();
        if (myError) console.error('Error fetching my stats:', myError);
        else if (myData) setMyStats(myData as unknown as EventGamification);
      }

      setLoading(false);
    };

    fetchData();
  }, [event, attendee]);

  const myBadges = (myStats?.badges || []) as string[];
  const myPosition = leaderboard.findIndex((e) => e.attendee_id === attendee?.id) + 1;

  const podiumColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
  const podiumIcons = ['🥇', '🥈', '🥉'];

  return (
    <div className="page-container pt-4 pb-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-silver/50 text-sm mb-4 hover:text-silver transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">🏆 Ranking</h1>
      <p className="text-sm text-silver/60 mb-6">Quem mais explora o evento ganha mais!</p>

      {/* My Stats Card */}
      {myStats && (
        <div className="card p-4 mb-6 border-accent-500/30 bg-accent-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-bold text-white text-lg">{myStats.points} pontos</p>
                <p className="text-[10px] text-silver/50">
                  {myPosition > 0 ? `${myPosition}o lugar` : 'Siga explorando!'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 rounded-xl bg-white/5">
              <p className="text-lg font-bold text-white">{myStats.visits_count}</p>
              <p className="text-[9px] text-silver/50">Visitas</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5">
              <p className="text-lg font-bold text-white">{myStats.interactions_count}</p>
              <p className="text-[9px] text-silver/50">Contatos</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5">
              <p className="text-lg font-bold text-white">{myStats.offers_claimed}</p>
              <p className="text-[9px] text-silver/50">Ofertas</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/5">
              <p className="text-lg font-bold text-white">{myBadges.length}</p>
              <p className="text-[9px] text-silver/50">Badges</p>
            </div>
          </div>

          {/* Badges */}
          <div>
            <p className="text-xs font-medium text-silver/60 mb-2">Badges</p>
            <div className="flex flex-wrap gap-2">
              {GAMIFICATION_BADGES.map((badge) => {
                const earned = myBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                      earned
                        ? 'bg-accent-500/20 text-accent-500 border border-accent-500/30'
                        : 'bg-white/5 text-silver/30 border border-white/10'
                    }`}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                    {!earned && <span className="text-[9px]">🔒</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <h2 className="section-title">Top 20</h2>
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-silver/50 text-sm">Nenhum participante pontuou ainda.</p>
          <p className="text-silver/30 text-xs mt-1">Visite patrocinadores para comecar!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => {
            const isMe = entry.attendee_id === attendee?.id;
            const entryBadges = (entry.badges || []) as string[];

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                  isMe
                    ? 'bg-accent-500/10 border border-accent-500/30'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="w-8 text-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-lg">{podiumIcons[i]}</span>
                  ) : (
                    <span className={`text-sm font-bold ${isMe ? 'text-accent-500' : 'text-silver/60'}`}>
                      {i + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isMe ? 'text-accent-500' : 'text-white'}`}>
                    {entry.attendee?.full_name || 'Participante'}
                    {isMe && ' (voce)'}
                  </p>
                  {entry.attendee?.company && (
                    <p className="text-[10px] text-silver/60 truncate">{entry.attendee.company}</p>
                  )}
                </div>

                {/* Mini badges */}
                <div className="flex -space-x-0.5">
                  {entryBadges.slice(0, 3).map((badgeId) => {
                    const badge = GAMIFICATION_BADGES.find((b) => b.id === badgeId);
                    return badge ? (
                      <span key={badge.id} className="text-xs">{badge.icon}</span>
                    ) : null;
                  })}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${i < 3 ? podiumColors[i] : isMe ? 'text-accent-500' : 'text-white'}`}>
                    {entry.points}
                  </p>
                  <p className="text-[9px] text-silver/60">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Points Guide */}
      <div className="mt-8">
        <h2 className="section-title">Como ganhar pontos</h2>
        <div className="space-y-2">
          {[
            { action: 'Visitar stand', points: 5, icon: '👁️' },
            { action: 'Pedir contato', points: 15, icon: '💬' },
            { action: 'Agendar reuniao', points: 25, icon: '📅' },
            { action: 'Resgatar oferta', points: 10, icon: '🎁' },
            { action: 'Favoritar sessao', points: 5, icon: '⭐' },
          ].map((item) => (
            <div key={item.action} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm text-silver/70">{item.action}</span>
              <span className="text-sm font-bold text-accent-500">+{item.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
