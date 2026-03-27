'use client';

import Link from 'next/link';
import { SPONSOR_TIER_LABELS } from '@/types';
import type { EventSponsor } from '@/types';

const tierStyles: Record<string, { badge: string; card: string; glow: string }> = {
  diamond: {
    badge: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
    card: 'border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400/50',
    glow: 'shadow-cyan-400/10',
  },
  gold: {
    badge: 'bg-gold/20 text-gold border-gold/30',
    card: 'border-gold/30 bg-gold/5 hover:border-gold/50',
    glow: 'shadow-gold/10',
  },
  silver: {
    badge: 'bg-white/10 text-silver-light border-white/20',
    card: 'border-white/10 bg-white/5 hover:border-white/20',
    glow: '',
  },
  bronze: {
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    card: 'border-orange-500/20 bg-white/5 hover:border-orange-500/30',
    glow: '',
  },
  support: {
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    card: 'border-white/10 bg-white/5 hover:border-white/20',
    glow: '',
  },
};

interface SponsorCardProps {
  sponsor: EventSponsor;
  compact?: boolean;
}

export function SponsorCard({ sponsor, compact }: SponsorCardProps) {
  const style = tierStyles[sponsor.tier] || tierStyles.support;

  if (compact) {
    return (
      <Link
        href={`/evento/patrocinadores/${sponsor.id}`}
        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${style.card}`}
      >
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-silver/50">{sponsor.name.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-white truncate">{sponsor.name}</h3>
        </div>
        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 ${style.badge}`}>
          {SPONSOR_TIER_LABELS[sponsor.tier] || sponsor.tier}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/evento/patrocinadores/${sponsor.id}`}
      className={`block rounded-2xl border p-4 text-center transition-all ${style.card} ${style.glow ? `shadow-lg ${style.glow}` : ''}`}
    >
      {sponsor.logo_url ? (
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="w-20 h-20 rounded-2xl object-contain mx-auto mb-3 bg-white/10 p-2"
        />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-silver/60">{sponsor.name.charAt(0)}</span>
        </div>
      )}
      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border mb-2 ${style.badge}`}>
        {SPONSOR_TIER_LABELS[sponsor.tier] || sponsor.tier}
      </span>
      <h3 className="font-semibold text-sm text-white">{sponsor.name}</h3>
    </Link>
  );
}
