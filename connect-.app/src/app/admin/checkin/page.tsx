'use client';

import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import type { EventAttendee } from '@/types';

export default function AdminCheckinPage() {
  const { event } = useEvent();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [attendee, setAttendee] = useState<EventAttendee | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error' | 'already'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<any>(null);

  const processCode = async (code: string) => {
    if (!event) return;
    setScanResult(code);
    setStatus('scanning');

    const supabase = createSupabaseBrowser();

    const { data } = await supabase
      .from('event_attendees')
      .select('id, full_name, company, badge_code, ticket_type, checked_in_at, avatar_url')
      .eq('event_id', event.id)
      .eq('badge_code', code)
      .single();

    if (!data) {
      setStatus('error');
      setErrorMsg('Badge nao encontrado');
      setAttendee(null);
      return;
    }

    const att = data as EventAttendee;
    setAttendee(att);

    if (att.checked_in_at) {
      setStatus('already');
      return;
    }

    await supabase
      .from('event_attendees')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', att.id)
      .eq('event_id', event.id);

    setAttendee({ ...att, checked_in_at: new Date().toISOString() });
    setStatus('success');
  };

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          scanner.stop();
          processCode(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setErrorMsg('Nao foi possivel acessar a camera');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processCode(manualCode.trim().toUpperCase());
      setManualCode('');
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setAttendee(null);
    setStatus('idle');
    setErrorMsg('');
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-6">Check-in</h1>

      {status === 'idle' && (
        <div className="space-y-4">
          {/* Camera Scanner */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
            <div id="qr-reader" className="mx-auto mb-3 overflow-hidden rounded-xl" />
            <button onClick={startScanner} className="btn-primary w-full">
              Escanear QR Code
            </button>
          </div>

          {/* Manual input */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <h2 className="font-semibold text-sm text-white mb-2">Codigo manual</h2>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: CV-ABC123"
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="btn-primary"
              >
                OK
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Result */}
      {(status === 'success' || status === 'already' || status === 'error') && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-green-400 mb-1">Check-in realizado!</h2>
            </>
          )}

          {status === 'already' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-lg font-bold text-amber-400 mb-1">Ja fez check-in</h2>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">❌</span>
              </div>
              <h2 className="text-lg font-bold text-red-400 mb-1">{errorMsg}</h2>
            </>
          )}

          {attendee && (
            <div className="mt-3 p-3 bg-white/5 rounded-xl">
              <p className="font-semibold text-white">{attendee.full_name}</p>
              <p className="text-sm text-silver/50">
                {attendee.company || ''} {attendee.badge_code ? `• ${attendee.badge_code}` : ''}
              </p>
              {attendee.ticket_type && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-500 text-xs font-medium">
                  {attendee.ticket_type}
                </span>
              )}
            </div>
          )}

          <button onClick={resetScan} className="btn-primary w-full mt-4">
            Proximo check-in
          </button>
        </div>
      )}

      {status === 'scanning' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center py-8">
          <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-silver/50">Processando...</p>
        </div>
      )}
    </div>
  );
}
