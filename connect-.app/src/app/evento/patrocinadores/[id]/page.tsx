'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { LeadCapture } from '@/components/crm/LeadCapture';
import { SponsorOffer } from '@/components/sponsors/SponsorOffer';
import { MeetingScheduler } from '@/components/sponsors/MeetingScheduler';
import { awardPoints } from '@/lib/gamification';
import { getWhatsAppUrl } from '@/lib/utils';
import { SPONSOR_TIER_LABELS } from '@/types';
import type { EventSponsor } from '@/types';

export default function SponsorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { attendee } = useAttendee();
  const { event } = useEvent();
  const [sponsor, setSponsor] = useState<EventSponsor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_sponsors')
      .select('id, event_id, name, tier, tagline, description, logo_url, banner_url, website_url, instagram_url, linkedin_url, facebook_url, twitter_url, whatsapp_phone, segment, materials, is_active, sort_order')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Error fetching sponsor:', error);
        else if (data) setSponsor(data as EventSponsor);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoading />;
  if (!sponsor) {
    return (
      <div className="page-container pt-4 text-center">
        <p className="text-silver/50">Patrocinador nao encontrado</p>
        <button onClick={() => router.back()} className="btn-ghost mt-4">
          Voltar
        </button>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    diamond: 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30',
    gold: 'bg-gold/20 text-gold border border-gold/30',
    silver: 'bg-white/10 text-silver-light border border-white/20',
    bronze: 'bg-orange-500/20 text-orange-400',
    support: 'bg-blue-500/20 text-blue-400',
  };

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

      {sponsor.banner_url ? (
        <div className="rounded-2xl overflow-hidden mb-4 aspect-[3/1]">
          <img src={sponsor.banner_url} alt={sponsor.name} className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div className="flex items-start gap-4 mb-6">
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="w-20 h-20 rounded-2xl object-contain bg-white/10 p-2 border border-white/10"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-accent-500">{sponsor.name.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white">{sponsor.name}</h1>
          {sponsor.tagline && (
            <p className="text-sm text-silver/60 mt-0.5">{sponsor.tagline}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${tierColors[sponsor.tier] || tierColors.support}`}>
              {SPONSOR_TIER_LABELS[sponsor.tier] || sponsor.tier}
            </span>
            {sponsor.segment && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-silver/70">
                {sponsor.segment}
              </span>
            )}
          </div>
        </div>
      </div>

      {sponsor.description && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-2">Sobre</h2>
          <p className="text-sm text-silver/60 leading-relaxed whitespace-pre-line">{sponsor.description}</p>
        </div>
      )}

      {/* Links & Social Media */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {sponsor.website_url && (
          <a
            href={sponsor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-accent-500 font-medium hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            Site
          </a>
        )}
        {sponsor.instagram_url && (
          <a href={sponsor.instagram_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-pink-400 font-medium hover:bg-white/10 transition-colors">
            <span className="text-base">📸</span> Instagram
          </a>
        )}
        {sponsor.linkedin_url && (
          <a href={sponsor.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-blue-400 font-medium hover:bg-white/10 transition-colors">
            <span className="text-base">💼</span> LinkedIn
          </a>
        )}
        {sponsor.facebook_url && (
          <a href={sponsor.facebook_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-blue-300 font-medium hover:bg-white/10 transition-colors">
            <span className="text-base">👥</span> Facebook
          </a>
        )}
        {sponsor.whatsapp_phone && (
          <a href={getWhatsAppUrl(sponsor.whatsapp_phone)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400 font-medium hover:bg-green-500/20 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        )}
      </div>

      {sponsor.materials && sponsor.materials.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-2">Materiais</h2>
          <div className="space-y-2">
            {sponsor.materials.map((mat: { name: string; url: string }, i: number) => (
              <a
                key={i}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-silver/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm text-silver/70 font-medium">{mat.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Ofertas exclusivas */}
      <SponsorOffer sponsorId={sponsor.id} attendee={attendee} />

      {/* Lead Capture - Interesse qualificado */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-white mb-3">Tenho interesse</h2>
        <div className="card p-4">
          {attendee ? (
            <LeadCapture attendee={attendee} sponsor={sponsor} />
          ) : (
            <p className="text-sm text-silver/50 text-center py-4">
              Carregando perfil...
            </p>
          )}
        </div>
      </div>

      {/* Agendar reuniao */}
      <div className="mt-4">
        <MeetingScheduler attendee={attendee} sponsor={sponsor} className="w-full" />
      </div>

      <VisitTracker attendeeId={attendee?.id} sponsorId={sponsor.id} eventId={event?.id} />
    </div>
  );
}

function VisitTracker({ attendeeId, sponsorId, eventId }: { attendeeId?: string; sponsorId: string; eventId?: string }) {
  useEffect(() => {
    if (!attendeeId || !eventId) return;
    const supabase = createSupabaseBrowser();

    // Dedup: only register visit if not already tracked for this attendee+sponsor
    const registerVisit = async () => {
      const { data: existing, error: visitCheckError } = await supabase
        .from('event_interactions')
        .select('id')
        .eq('attendee_id', attendeeId)
        .eq('sponsor_id', sponsorId)
        .eq('interaction_type', 'visit')
        .limit(1);

      if (visitCheckError) { console.error('Error checking visit:', visitCheckError); return; }

      if (!existing || existing.length === 0) {
        await supabase.from('event_interactions').insert({
          event_id: eventId,
          attendee_id: attendeeId,
          sponsor_id: sponsorId,
          interaction_type: 'visit',
        });
        // Award gamification points for first visit
        await awardPoints(eventId, attendeeId, 'visit');
      }
    };

    registerVisit();
  }, [attendeeId, sponsorId, eventId]);
  return null;
}
