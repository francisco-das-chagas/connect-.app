'use client';

import { useState, useCallback } from 'react';

export type ViewMode = 'participante' | 'patrocinador' | 'admin';

export function useViewMode(defaultMode: ViewMode = 'participante') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
  const [previewSponsorId, setPreviewSponsorId] = useState<string | null>(null);

  const switchTo = useCallback((mode: ViewMode, sponsorId?: string) => {
    setViewMode(mode);
    if (mode === 'patrocinador' && sponsorId) {
      setPreviewSponsorId(sponsorId);
    } else {
      setPreviewSponsorId(null);
    }
  }, []);

  return { viewMode, previewSponsorId, switchTo };
}
