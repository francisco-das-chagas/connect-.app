'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { useAttendee } from '@/hooks/useAttendee';
import { usePresence } from '@/hooks/usePresence';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { AttendeeCard } from '@/components/networking/AttendeeCard';
import { GroupChat } from '@/components/networking/GroupChat';
import { getShortName } from '@/lib/utils';
import { INTEREST_OPTIONS } from '@/types';
import type { EventAttendee } from '@/types';

type TabKey = 'grupo' | 'pessoas';

export default function NetworkingPage() {
  const { event } = useEvent();
  const { attendee: myAttendee } = useAttendee();
  const [activeTab, setActiveTab] = useState<TabKey>('grupo');
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterInterest, setFilterInterest] = useState('');
  const [showOnlyCommon, setShowOnlyCommon] = useState(false);
  // offlineToast removed — messaging now works for offline users too

  // Determine if current user is sponsor or attendee
  const isSponsor = myAttendee?.ticket_type === 'sponsor';
  const senderType: 'participante' | 'patrocinador' = isSponsor ? 'patrocinador' : 'participante';

  // Presence tracking - tracks who is online in networking
  const { onlineUsers, isOnline, onlineCount } = usePresence({
    eventId: event?.id || '',
    attendeeId: myAttendee?.id || '',
    name: myAttendee ? getShortName(myAttendee.full_name) : '',
    type: senderType,
    enabled: !!event?.id && !!myAttendee?.id,
  });

  // Load all networking-visible attendees
  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_attendees')
      .select('id, full_name, company, job_title, avatar_url, interests, ticket_type')
      .eq('event_id', event.id)
      .eq('networking_opt_in', true)
      .order('full_name', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('Error fetching attendees:', error); }
        else if (data) {
          const others = (data as EventAttendee[]).filter(
            (a) => a.id !== myAttendee?.id
          );
          setAttendees(others);
        }
        setLoading(false);
      });
  }, [event, myAttendee]);

  // Filter attendees
  const filteredAttendees = (() => {
    let result = attendees;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.company?.toLowerCase().includes(q) ||
          a.job_title?.toLowerCase().includes(q)
      );
    }

    if (filterInterest) {
      result = result.filter(
        (a) => a.interests && a.interests.includes(filterInterest)
      );
    }

    if (showOnlyCommon && myAttendee?.interests) {
      result = result.filter(
        (a) =>
          a.interests &&
          a.interests.some((i: string) => myAttendee.interests?.includes(i))
      );
    }

    // Sort: online first, then offline
    result = [...result].sort((a, b) => {
      const aOnline = isOnline(a.id) ? 1 : 0;
      const bOnline = isOnline(b.id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return a.full_name.localeCompare(b.full_name);
    });

    return result;
  })();

  const getCommonInterests = (other: EventAttendee): string[] => {
    if (!myAttendee?.interests || !other.interests) return [];
    return myAttendee.interests.filter((i: string) => other.interests?.includes(i));
  };

  // Determine user type for display purposes
  const getUserType = (a: EventAttendee): 'participante' | 'patrocinador' | undefined => {
    const presenceUser = onlineUsers.get(a.id);
    if (presenceUser) return presenceUser.type;
    // If not online, check ticket type
    if (a.ticket_type === 'sponsor') return 'patrocinador';
    return undefined;
  };

  // handleOfflineClick removed — users can now chat with offline participants

  if (loading) return <PageLoading />;

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: 'grupo', label: 'Grupo', icon: '💬' },
    { key: 'pessoas', label: 'Pessoas', icon: '👥', count: onlineCount },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 bg-navy">
        <h1 className="text-xl font-bold text-white mb-3">Networking</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white'
                  : 'text-silver/50 hover:text-silver/70'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'grupo' && event && myAttendee && (
        <GroupChat
          eventId={event.id}
          senderId={myAttendee.id}
          senderName={myAttendee.full_name}
          senderType={senderType}
        />
      )}

      {activeTab === 'pessoas' && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Search */}
          <div className="relative mb-3">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, empresa..."
              className="input pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <select
              value={filterInterest}
              onChange={(e) => setFilterInterest(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-silver/60 min-w-fit"
            >
              <option value="">Todos os interesses</option>
              {INTEREST_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowOnlyCommon(!showOnlyCommon)}
              className={`text-xs px-3 py-1.5 rounded-full border min-w-fit transition-colors ${
                showOnlyCommon
                  ? 'border-accent-500/30 bg-accent-500/10 text-accent-500'
                  : 'border-white/10 bg-white/5 text-silver/60'
              }`}
            >
              Em comum
            </button>
          </div>

          {/* Count + online indicator */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-silver/60">
              {filteredAttendees.length} pessoa{filteredAttendees.length !== 1 ? 's' : ''}
            </p>
            {onlineCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {onlineCount} online
              </span>
            )}
          </div>

          {/* List */}
          {filteredAttendees.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Nenhum participante"
              description={
                search
                  ? 'Tente outra busca'
                  : 'Os participantes aparecerao conforme se cadastram'
              }
            />
          ) : (
            <div className="space-y-2 pb-4">
              {filteredAttendees.map((a) => (
                <AttendeeCard
                  key={a.id}
                  attendee={a}
                  commonInterests={getCommonInterests(a)}
                  isOnline={isOnline(a.id)}
                  userType={getUserType(a)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline toast removed — users can now message offline participants */}
    </div>
  );
}
