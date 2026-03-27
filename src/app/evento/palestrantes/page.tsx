'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { getInitials } from '@/lib/utils';
import type { EventSession } from '@/types';

interface Speaker {
  speaker_name: string;
  speaker_title: string | null;
  speaker_photo_url: string | null;
  speaker_bio: string | null;
  id: string;
  track: string | null;
}

export default function PalestrantesPage() {
  const { event } = useEvent();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_sessions')
      .select('id, speaker_name, speaker_title, speaker_photo_url, speaker_bio, track')
      .eq('event_id', event.id)
      .not('speaker_name', 'is', null)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const unique = new Map<string, Speaker>();
          (data as Speaker[]).forEach((s) => {
            if (s.speaker_name && !unique.has(s.speaker_name)) {
              unique.set(s.speaker_name, s);
            }
          });
          setSpeakers(Array.from(unique.values()));
        }
        setLoading(false);
      });
  }, [event]);

  if (loading) return <PageLoading />;

  return (
    <div className="page-container pt-4">
      <h1 className="text-xl font-bold text-white mb-4">Palestrantes</h1>

      {speakers.length === 0 ? (
        <EmptyState icon="🎤" title="Nenhum palestrante" description="A programacao sera publicada em breve" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {speakers.map((speaker) => (
            <Link
              key={speaker.speaker_name}
              href={`/evento/agenda/${speaker.id}`}
              className="card-hover text-center"
            >
              {speaker.speaker_photo_url ? (
                <img
                  src={speaker.speaker_photo_url}
                  alt={speaker.speaker_name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-accent-500">
                    {getInitials(speaker.speaker_name)}
                  </span>
                </div>
              )}
              <h3 className="font-semibold text-sm text-white">{speaker.speaker_name}</h3>
              {speaker.speaker_title && (
                <p className="text-xs text-silver/50 mt-0.5 line-clamp-2">{speaker.speaker_title}</p>
              )}
              {speaker.track && (
                <span className="badge-track mt-2 text-[10px]">{speaker.track}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
