'use client';

import Link from 'next/link';
import { formatTime, isSessionLive, isSessionPast, cn } from '@/lib/utils';
import { SESSION_TYPE_LABELS } from '@/types';
import type { EventSession } from '@/types';

interface AgendaCardProps {
  session: EventSession;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function AgendaCard({ session, isFavorited, onToggleFavorite }: AgendaCardProps) {
  const live = isSessionLive(session.start_time, session.end_time);
  const past = isSessionPast(session.end_time);

  return (
    <Link
      href={`/evento/agenda/${session.id}`}
      className={cn(
        'card-hover block relative',
        past && 'opacity-60',
        live && 'border-accent-500/30 bg-accent-500/5'
      )}
    >
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Favoritar sessao'}
          className="absolute top-3 right-3 p-1"
        >
          <svg
            className={cn('w-5 h-5', isFavorited ? 'text-accent-500 fill-accent-500' : 'text-white/20')}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            fill={isFavorited ? 'currentColor' : 'none'}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      )}

      <div className="flex gap-3">
        <div className="flex flex-col items-center w-14 flex-shrink-0">
          <span className="text-sm font-bold text-accent-500">{formatTime(session.start_time)}</span>
          <div className="w-px h-full bg-white/10 my-1" />
          <span className="text-xs text-silver/60">{formatTime(session.end_time)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {live && <span className="badge-live">AO VIVO</span>}
            {session.track && <span className="badge-track">{session.track}</span>}
            <span className="text-[10px] text-silver/60">
              {SESSION_TYPE_LABELS[session.session_type] || session.session_type}
            </span>
          </div>

          <h3 className="font-semibold text-white text-sm leading-tight pr-8">{session.title}</h3>

          {session.speaker_name && (
            <div className="flex items-center gap-2 mt-2">
              {session.speaker_photo_url ? (
                <img
                  src={session.speaker_photo_url}
                  alt={session.speaker_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-silver/50">{session.speaker_name.charAt(0)}</span>
                </div>
              )}
              <span className="text-xs text-silver/50">{session.speaker_name}</span>
            </div>
          )}

          {session.room && (
            <p className="text-xs text-silver/60 mt-1">📍 {session.room}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
