'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { SponsorCard } from '@/components/sponsors/SponsorCard';
import { SPONSOR_TIER_ORDER, SPONSOR_TIER_LABELS } from '@/types';
import type { EventSponsor } from '@/types';

const tierIcons: Record<string, string> = {
  diamond: '💎',
  gold: '🥇',
  silver: '🥈',
};

const tierDescriptions: Record<string, string> = {
  diamond: 'Palco principal — Palestra no Palco Valley',
  gold: 'Oficina — Ministra oficina no Palco Valley',
  silver: 'Exposição — Balcão totem para divulgação',
};

const tierHeaderColors: Record<string, string> = {
  diamond: 'text-cyan-300',
  gold: 'text-gold',
  silver: 'text-silver-light',
};

export default function PatrocinadoresPage() {
  const { event } = useEvent();
  const [sponsors, setSponsors] = useState<EventSponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_sponsors')
      .select('id, name, logo_url, tier, tagline, segment, sort_order')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error fetching sponsors:', error);
        else if (data) setSponsors(data as EventSponsor[]);
        setLoading(false);
      });
  }, [event]);

  if (loading) return <PageLoading />;

  const grouped = sponsors.reduce<Record<string, EventSponsor[]>>((acc, s) => {
    if (!acc[s.tier]) acc[s.tier] = [];
    acc[s.tier].push(s);
    return acc;
  }, {});

  const sortedTiers = SPONSOR_TIER_ORDER.filter((t) => grouped[t]);

  return (
    <div className="page-container pt-4">
      <h1 className="text-xl font-bold text-white mb-1 font-montserrat uppercase tracking-tight">Patrocinadores</h1>
      <p className="text-xs text-white/40 mb-6 font-poppins">Conheça quem faz o Connect Valley acontecer</p>

      {sponsors.length === 0 ? (
        <EmptyState icon="🏢" title="Nenhum patrocinador" description="Os patrocinadores serão publicados em breve" />
      ) : (
        <div className="space-y-8">
          {sortedTiers.map((tier) => (
            <div key={tier}>
              {/* Tier Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{tierIcons[tier] || '🏢'}</span>
                  <h2 className={`text-sm font-bold uppercase tracking-wider font-montserrat ${tierHeaderColors[tier] || 'text-white/60'}`}>
                    {SPONSOR_TIER_LABELS[tier] || tier}
                  </h2>
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {grouped[tier].length}
                  </span>
                </div>
                {tierDescriptions[tier] && (
                  <p className="text-[11px] text-white/30 font-poppins ml-7">
                    {tierDescriptions[tier]}
                  </p>
                )}
              </div>

              {/* Sponsor Cards */}
              {tier === 'diamond' || tier === 'gold' ? (
                <div className="grid grid-cols-2 gap-3">
                  {grouped[tier].map((sponsor) => (
                    <SponsorCard key={sponsor.id} sponsor={sponsor} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {grouped[tier].map((sponsor) => (
                    <SponsorCard key={sponsor.id} sponsor={sponsor} compact />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
