'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import { ParticipantView } from '@/components/views/ParticipantView';
import { SponsorView } from '@/components/views/SponsorView';

function ViewContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') ?? 'participante';
  const sponsorId = searchParams.get('sponsorId');
  const { attendee } = useAttendee();
  const { event } = useEvent();

  if (!attendee || !event) return null;

  // Only admin/organizer/staff can access view simulation
  if (!['admin', 'organizer', 'staff'].includes(attendee.ticket_type)) {
    return (
      <div className="p-4 text-center text-red-400 text-sm">
        Acesso restrito a administradores.
      </div>
    );
  }

  if (mode === 'patrocinador' && sponsorId) {
    return <SponsorView eventId={event.id} sponsorId={sponsorId} />;
  }

  return <ParticipantView eventId={event.id} attendeeId={attendee.id} />;
}

export default function ViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030816] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
        </div>
      }
    >
      <ViewContent />
    </Suspense>
  );
}
