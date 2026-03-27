'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { EVENT_CONFIG } from '@/config/event';
import { getCountdown } from '@/lib/utils';

const INITIAL = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function EventBanner() {
  const [countdown, setCountdown] = useState(INITIAL);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCountdown(getCountdown(EVENT_CONFIG.dates.start));
    const interval = setInterval(() => {
      setCountdown(getCountdown(EVENT_CONFIG.dates.start));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={EVENT_CONFIG.images.hero}
          alt="Connect Valley"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/60" />
      </div>

      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-1">
          <Image
            src={EVENT_CONFIG.images.icon}
            alt=""
            width={16}
            height={16}
            className="opacity-70"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold font-montserrat">
            {EVENT_CONFIG.edition}
          </span>
        </div>
        <h2 className="text-lg font-bold mb-0.5 font-montserrat tracking-tight">
          <span className="text-gold-gradient">Connect</span> <span className="text-white">Valley 2026</span>
        </h2>
        <p className="text-xs text-white/40 mb-4 font-poppins">
          {EVENT_CONFIG.dates.display} — {EVENT_CONFIG.venue}
        </p>

        <div className="flex gap-2">
          {[
            { value: countdown.days, label: 'dias' },
            { value: countdown.hours, label: 'horas' },
            { value: countdown.minutes, label: 'min' },
            { value: countdown.seconds, label: 'seg' },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 border border-white/5 backdrop-blur rounded-xl px-3 py-2 text-center min-w-[52px]">
              <div className="text-xl font-bold text-gold font-montserrat">
                {mounted ? String(item.value).padStart(2, '0') : '--'}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-white/40 font-montserrat">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
