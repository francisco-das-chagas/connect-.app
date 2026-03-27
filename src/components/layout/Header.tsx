'use client';

import Link from 'next/link';
import Image from 'next/image';
import { EVENT_CONFIG } from '@/config/event';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-navy/95 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/evento" className="flex items-center gap-2.5">
          <Image
            src={EVENT_CONFIG.images.icon}
            alt="Connect Valley"
            width={24}
            height={24}
            className="opacity-90"
          />
          <span className="font-bold text-white text-sm font-montserrat tracking-tight">{EVENT_CONFIG.name}</span>
        </Link>
        <Link
          href="/evento/meu-perfil"
          aria-label="Meu perfil"
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-gold/30 transition-colors"
        >
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
