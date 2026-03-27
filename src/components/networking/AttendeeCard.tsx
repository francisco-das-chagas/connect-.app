'use client';

import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import type { EventAttendee } from '@/types';

interface AttendeeCardProps {
  attendee: EventAttendee;
  commonInterests?: string[];
  isOnline?: boolean;
  userType?: 'participante' | 'patrocinador';
  onOfflineClick?: () => void;
}

export function AttendeeCard({ attendee, commonInterests, isOnline = false, userType, onOfflineClick }: AttendeeCardProps) {
  const content = (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        {attendee.avatar_url ? (
          <img
            src={attendee.avatar_url}
            alt={attendee.full_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-accent-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-accent-500">
              {getInitials(attendee.full_name)}
            </span>
          </div>
        )}
        {/* Online dot */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-navy ${
            isOnline ? 'bg-green-400' : 'bg-silver/30'
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-sm text-white truncate">{attendee.full_name}</h3>
          {userType === 'patrocinador' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-wider flex-shrink-0">
              Sponsor
            </span>
          )}
        </div>
        {attendee.company && (
          <p className="text-xs text-silver/50 truncate">
            {attendee.job_title ? `${attendee.job_title} • ` : ''}
            {attendee.company}
          </p>
        )}
        {commonInterests && commonInterests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {commonInterests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isOnline && (
          <span className="text-[10px] text-silver/30">offline</span>
        )}
        <svg
          className="w-4 h-4 text-white/20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  );

  // Always link to chat — messaging works regardless of online status
  return (
    <Link href={`/evento/networking/chat/${attendee.id}`}>
      {content}
    </Link>
  );
}
