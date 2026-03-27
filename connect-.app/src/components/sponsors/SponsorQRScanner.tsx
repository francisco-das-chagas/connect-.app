'use client';

import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { handleSponsorInteraction } from '@/lib/crm-integration';
import { awardPoints } from '@/lib/gamification';
import { getWhatsAppUrl } from '@/lib/utils';
import type { EventAttendee, EventSponsor } from '@/types';

interface SponsorQRScannerTabProps {
  sponsor: EventSponsor;
  eventId: string;
}

export function SponsorQRScannerTab({ sponsor, eventId }: SponsorQRScannerTabProps) {
  const [scannedAttendee, setScannedAttendee] = useState<EventAttendee | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error' | 'duplicate'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<any>(null);

  const processCode = async (code: string) => {
    setStatus('scanning');
    setErrorMsg('');

    try {
      const supabase = createSupabaseBrowser();

      // 1. Find attendee by badge code (explicit columns — no PII leak)
      const { data: attendee } = await supabase
        .from('event_attendees')
        .select('id, full_name, company, job_title, email, phone, linkedin_url, interests, avatar_url, photo_url, badge_code')
        .eq('event_id', eventId)
        .eq('badge_code', code)
        .single();

      if (!attendee) {
        setStatus('error');
        setErrorMsg('Badge nao encontrado. Verifique o codigo.');
        setScannedAttendee(null);
        return;
      }

      const att = attendee as EventAttendee;
      setScannedAttendee(att);

      // 2. Check for duplicate scan
      const { data: existing } = await supabase
        .from('event_interactions')
        .select('id')
        .eq('sponsor_id', sponsor.id)
        .eq('attendee_id', att.id)
        .eq('interaction_type', 'qr_scan')
        .maybeSingle();

      if (existing) {
        setStatus('duplicate');
        return;
      }

      // 3. Create interaction
      await handleSponsorInteraction({
        event_id: eventId,
        attendee_id: att.id,
        sponsor_id: sponsor.id,
        interaction_type: 'qr_scan',
        message: 'Capturado via QR Scanner no evento',
      });

      // 4. Award gamification points to attendee
      await awardPoints(eventId, att.id, 'qr_scan');

      setStatus('success');
    } catch (err) {
      console.error('QR scan error:', err);
      setStatus('error');
      setErrorMsg('Erro ao processar scan. Tente novamente.');
    }
  };

  const startScanner = async () => {
    try {
      setCameraActive(true);
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('sponsor-qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          scanner.stop().catch(() => {});
          setCameraActive(false);
          processCode(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setCameraActive(false);
      setErrorMsg('Nao foi possivel acessar a camera. Tente o codigo manual.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopScanner();
      processCode(manualCode.trim().toUpperCase());
      setManualCode('');
    }
  };

  const resetScan = () => {
    setScannedAttendee(null);
    setStatus('idle');
    setErrorMsg('');
    stopScanner();
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  // Results view (success, duplicate, error with attendee)
  if (status !== 'idle' && status !== 'scanning' && !(status === 'error' && !scannedAttendee)) {
    return (
      <div className="space-y-4">
        {/* Status banner */}
        {status === 'success' && (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-sm font-semibold text-green-400">Lead capturado com sucesso!</p>
            <p className="text-xs text-silver/50 mt-1">+10 pontos para o participante</p>
          </div>
        )}

        {status === 'duplicate' && (
          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <span className="text-3xl block mb-2">⚠️</span>
            <p className="text-sm font-semibold text-yellow-400">Lead ja capturado anteriormente</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
            <span className="text-3xl block mb-2">❌</span>
            <p className="text-sm font-semibold text-red-400">{errorMsg}</p>
          </div>
        )}

        {/* Attendee profile card */}
        {scannedAttendee && (
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/20 flex items-center justify-center">
                {scannedAttendee.photo_url || scannedAttendee.avatar_url ? (
                  <img
                    src={scannedAttendee.photo_url || scannedAttendee.avatar_url || ''}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-accent-500">
                    {scannedAttendee.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-lg truncate">{scannedAttendee.full_name}</p>
                {scannedAttendee.company && (
                  <p className="text-sm text-silver/60">
                    {scannedAttendee.company}
                    {scannedAttendee.job_title && ` · ${scannedAttendee.job_title}`}
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              {scannedAttendee.email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-silver/60">📧</span>
                  <span className="text-silver/70">{scannedAttendee.email}</span>
                </div>
              )}
              {scannedAttendee.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-silver/60">📱</span>
                  <span className="text-silver/70">{scannedAttendee.phone}</span>
                </div>
              )}
              {scannedAttendee.linkedin_url && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-silver/60">🔗</span>
                  <a href={scannedAttendee.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    LinkedIn
                  </a>
                </div>
              )}
              {scannedAttendee.interests && scannedAttendee.interests.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-silver/60 mb-1.5">Interesses:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scannedAttendee.interests.map((interest) => (
                      <span key={interest} className="px-2 py-0.5 rounded-full bg-white/5 text-silver/60 text-[10px]">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {scannedAttendee.phone && (
                <a
                  href={getWhatsAppUrl(scannedAttendee.phone, `Ola ${scannedAttendee.full_name}! Sou da ${sponsor.name}, prazer em conhece-lo(a) no Connect Valley 2026!`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-green-500/20 text-green-400 font-semibold text-sm hover:bg-green-500/30 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              <button
                onClick={resetScan}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors"
              >
                <span>📷</span>
                Proximo scan
              </button>
            </div>
          </div>
        )}

        {/* Back to scanner if error without attendee */}
        {!scannedAttendee && (
          <button
            onClick={resetScan}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  // Scanner view (idle / scanning)
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <span className="text-4xl block mb-2">📷</span>
        <h2 className="font-bold text-white text-lg">Scanner de Badge</h2>
        <p className="text-xs text-silver/50 mt-1">Escaneie o QR code do participante para capturar o lead.</p>
      </div>

      {/* Camera Scanner */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
        <div id="sponsor-qr-reader" className="mx-auto mb-3 overflow-hidden rounded-xl" />
        {!cameraActive ? (
          <button
            onClick={startScanner}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            Abrir camera
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-colors"
          >
            Parar camera
          </button>
        )}
      </div>

      {/* Manual input fallback */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <h3 className="font-semibold text-sm text-white mb-2">Codigo manual</h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-silver/30 focus:border-accent-500/50 focus:outline-none uppercase"
            placeholder="CV26-XXXXXXXX"
            maxLength={13}
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-3 rounded-xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Loading state */}
      {status === 'scanning' && (
        <div className="text-center py-4">
          <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-silver/60">Buscando participante...</p>
        </div>
      )}

      {/* Error without attendee */}
      {status === 'error' && !scannedAttendee && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-sm text-red-400">{errorMsg}</p>
          <button onClick={resetScan} className="text-xs text-silver/50 mt-2 hover:text-silver">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
