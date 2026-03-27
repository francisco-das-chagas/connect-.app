'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { EventAttendee } from '@/types';
import { getInitials } from '@/lib/utils';

interface QRBadgeProps {
  attendee: EventAttendee;
  size?: number;
}

export function QRBadge({ attendee, size = 200 }: QRBadgeProps) {
  const ticketColors: Record<string, string> = {
    standard: 'bg-white/10 text-silver border-white/20',
    general: 'bg-white/10 text-silver border-white/20',
    vip: 'bg-accent-500/20 text-accent-500 border-accent-500/30',
    speaker: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    sponsor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    staff: 'bg-green-500/20 text-green-400 border-green-500/30',
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    organizer: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  };

  const ticketLabels: Record<string, string> = {
    standard: 'Participante',
    general: 'Participante',
    vip: 'VIP',
    speaker: 'Palestrante',
    sponsor: 'Patrocinador',
    staff: 'Staff',
    admin: 'Admin',
    organizer: 'Organizador',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="card p-6 text-center">
        <div
          className={`inline-block px-4 py-1 rounded-full text-sm font-bold border-2 mb-4 ${
            ticketColors[attendee.ticket_type] || ticketColors.standard
          }`}
        >
          {ticketLabels[attendee.ticket_type] || 'Participante'}
        </div>

        <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-3">
          {attendee.photo_url ? (
            <img
              src={attendee.photo_url}
              alt={attendee.full_name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-accent-500">
              {getInitials(attendee.full_name)}
            </span>
          )}
        </div>

        <h2 className="text-xl font-bold text-white">{attendee.full_name}</h2>
        {attendee.company && (
          <p className="text-sm text-silver/60">{attendee.job_title} - {attendee.company}</p>
        )}

        <div className="mt-4 p-4 bg-white rounded-xl inline-block">
          <QRCodeSVG
            value={attendee.badge_code || attendee.id}
            size={size}
            level="M"
            includeMargin={false}
          />
        </div>

        <p className="mt-2 text-xs font-mono text-silver/60">{attendee.badge_code}</p>
      </div>
    </div>
  );
}
