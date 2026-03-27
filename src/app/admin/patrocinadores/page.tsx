'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { SPONSOR_TIER_LABELS } from '@/types';
import type { EventSponsor } from '@/types';

interface SponsorWithStats extends EventSponsor {
  visit_count: number;
  contact_count: number;
  meeting_count: number;
  material_count: number;
}

export default function AdminPatrocinadoresPage() {
  const { event } = useEvent();
  const [sponsors, setSponsors] = useState<SponsorWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_sponsors')
      .select('id, event_id, name, logo_url, tier, sort_order')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true })
      .then(async ({ data: sponsorsData }) => {
        if (!sponsorsData) {
          setLoading(false);
          return;
        }

        const sponsorsWithStats = await Promise.all(
          (sponsorsData as EventSponsor[]).map(async (sponsor) => {
            const { data: interactions } = await supabase
              .from('event_interactions')
              .select('interaction_type')
              .eq('sponsor_id', sponsor.id);

            const counts = {
              visit_count: 0,
              contact_count: 0,
              meeting_count: 0,
              material_count: 0,
            };

            interactions?.forEach((i) => {
              if (i.interaction_type === 'visit') counts.visit_count++;
              if (i.interaction_type === 'contact_request') counts.contact_count++;
              if (i.interaction_type === 'meeting_request') counts.meeting_count++;
              if (i.interaction_type === 'material_download') counts.material_count++;
            });

            return { ...sponsor, ...counts } as SponsorWithStats;
          })
        );

        setSponsors(sponsorsWithStats);
        setLoading(false);
      });
  }, [event]);

  if (loading) return <PageLoading />;

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-6">Relatorio Patrocinadores</h1>

      {sponsors.length === 0 ? (
        <p className="text-sm text-silver/50 text-center py-8">Nenhum patrocinador cadastrado</p>
      ) : (
        <div className="space-y-4">
          {sponsors.map((sponsor) => {
            const totalInteractions =
              sponsor.visit_count + sponsor.contact_count + sponsor.meeting_count + sponsor.material_count;

            return (
              <div key={sponsor.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  {sponsor.logo_url ? (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-accent-500">{sponsor.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-white">{sponsor.name}</h3>
                    <span className="text-[10px] text-silver/60">
                      {SPONSOR_TIER_LABELS[sponsor.tier] || sponsor.tier} • {totalInteractions} interacoes
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-xl bg-blue-500/20">
                    <p className="text-lg font-bold text-blue-400">{sponsor.visit_count}</p>
                    <p className="text-[10px] text-blue-400/70">Visitas</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-green-500/20">
                    <p className="text-lg font-bold text-green-400">{sponsor.contact_count}</p>
                    <p className="text-[10px] text-green-400/70">Contatos</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-purple-500/20">
                    <p className="text-lg font-bold text-purple-400">{sponsor.meeting_count}</p>
                    <p className="text-[10px] text-purple-400/70">Reunioes</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-amber-500/20">
                    <p className="text-lg font-bold text-amber-400">{sponsor.material_count}</p>
                    <p className="text-[10px] text-amber-400/70">Downloads</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
