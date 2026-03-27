'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import { useViewMode } from '@/hooks/useViewMode';
import { createSupabaseBrowser } from '@/lib/supabase';
import { ParticipantView } from './ParticipantView';
import { SponsorView } from './SponsorView';
import { AdminViewSwitcher } from './AdminViewSwitcher';
import type { ViewMode } from '@/hooks/useViewMode';

interface SponsorListItem {
  id: string;
  name: string;
  logo_url: string | null;
}

export function EventApp() {
  const router = useRouter();
  const { attendee, loading: attendeeLoading } = useAttendee();
  const { event, loading: eventLoading } = useEvent();
  const [sponsors, setSponsors] = useState<SponsorListItem[]>([]);

  const isAdmin =
    attendee && ['admin', 'organizer', 'staff'].includes(attendee.ticket_type);
  const isSponsor = attendee?.ticket_type === 'sponsor';

  const defaultMode: ViewMode = isSponsor
    ? 'patrocinador'
    : isAdmin
      ? 'admin'
      : 'participante';

  const { viewMode, previewSponsorId, switchTo } = useViewMode(defaultMode);

  // Load sponsor list for admin switcher
  useEffect(() => {
    if (!event || !isAdmin) return;
    const supabase = createSupabaseBrowser();
    supabase
      .from('event_sponsors')
      .select('id, name, logo_url')
      .eq('event_id', event.id)
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setSponsors(data);
      });
  }, [event, isAdmin]);

  // Find sponsor_id for sponsor users
  const [sponsorIdForUser, setSponsorIdForUser] = useState<string | null>(null);
  useEffect(() => {
    if (!event || !attendee || !isSponsor) return;
    const supabase = createSupabaseBrowser();
    // Sponsors are linked by matching the attendee's company or email to the sponsor
    supabase
      .from('event_sponsors')
      .select('id')
      .eq('event_id', event.id)
      .eq('contact_email', attendee.email)
      .single()
      .then(({ data }) => {
        if (data) setSponsorIdForUser(data.id);
      });
  }, [event, attendee, isSponsor]);

  if (attendeeLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-[#030816] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  if (!attendee || !event) {
    return null;
  }

  // Determine which sponsor ID to use for sponsor view
  const activeSponsorId = previewSponsorId ?? sponsorIdForUser;

  return (
    <div className="relative">
      {/* Render active view */}
      {viewMode === 'participante' && (
        <ParticipantView eventId={event.id} attendeeId={attendee.id} />
      )}

      {viewMode === 'patrocinador' && activeSponsorId && (
        <SponsorView eventId={event.id} sponsorId={activeSponsorId} />
      )}

      {viewMode === 'admin' && (
        // Admin uses existing Next.js routes — redirect
        <AdminRedirect />
      )}

      {/* View switcher — only for admin/organizer/staff */}
      {isAdmin && (
        <AdminViewSwitcher
          currentMode={viewMode}
          sponsors={sponsors}
          onSwitch={switchTo}
        />
      )}
    </div>
  );
}

/** When admin mode is selected, redirect to the admin dashboard */
function AdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.push('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#030816] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
    </div>
  );
}
