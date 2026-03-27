'use client';

import { useEffect, useState } from 'react';
import { getCountdown } from '@/lib/utils';
import { EVENT_CONFIG } from '@/config/event';

const INITIAL = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export default function Countdown() {
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
    <div className="mt-8 flex gap-2 max-w-sm mx-auto">
      {[
        { value: countdown.days, label: 'Dias' },
        { value: countdown.hours, label: 'Horas' },
        { value: countdown.minutes, label: 'Min' },
        { value: countdown.seconds, label: 'Seg' },
      ].map((item) => (
        <div key={item.label} className="bg-white/5 border border-white/5 backdrop-blur rounded-xl px-3 py-3 text-center flex-1">
          <div className="text-2xl font-bold text-gold font-montserrat">
            {mounted ? String(item.value).padStart(2, '0') : '--'}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-white/40 mt-1 font-montserrat">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
