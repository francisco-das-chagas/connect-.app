'use client';

import Link from 'next/link';
import { SPONSOR_TIER_LABELS } from '@/types';
import type { EventSponsor } from '@/types';

interface SponsorBoothProps {
  sponsor: EventSponsor;
}

export function SponsorBooth({ sponsor }: SponsorBoothProps) {
  return (
    <Link
      href={`/evento/patrocinadores/${sponsor.id}`}
      className="inline-block w-40 flex-shrink-0 snap-start"
    >
      <div className="bg-white/5 rounded-2xl border border-white/10 p-3 hover:bg-white/10 transition-colors h-full">
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="w-full h-20 rounded-xl object-contain bg-white/10 p-2 mb-2"
          />
        ) : (
          <div className="w-full h-20 rounded-xl bg-accent-500/20 flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-accent-500">{sponsor.name.charAt(0)}</span>
          </div>
        )}
        <h3 className="font-semibold text-xs text-white truncate">{sponsor.name}</h3>
        <span className="text-[10px] text-silver/60">
          {SPONSOR_TIER_LABELS[sponsor.tier] || sponsor.tier}
        </span>
      </div>
    </Link>
  );
}
