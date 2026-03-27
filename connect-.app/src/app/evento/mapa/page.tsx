'use client';

import { useEvent } from '@/hooks/useEvent';
import { EVENT_CONFIG } from '@/config/event';

export default function MapaPage() {
  const { event } = useEvent();

  return (
    <div className="page-container pt-4">
      <h1 className="text-xl font-bold text-white mb-4">Mapa do Evento</h1>

      <div className="card mb-4">
        <h2 className="font-semibold text-white mb-1">{EVENT_CONFIG.venue}</h2>
        <p className="text-sm text-silver/60 mb-3">{EVENT_CONFIG.location}</p>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(EVENT_CONFIG.venue + ' ' + EVENT_CONFIG.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-accent-500 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          Abrir no Google Maps
        </a>
      </div>

      {event?.banner_url ? (
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
          <img src={event.banner_url} alt="Mapa do evento" className="w-full" />
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center mb-4">
          <span className="text-4xl mb-3 block">🗺️</span>
          <p className="text-sm text-silver/50">O mapa do evento sera disponibilizado em breve</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <span className="text-2xl mb-2 block">🅿️</span>
          <h3 className="font-semibold text-sm text-white">Estacionamento</h3>
          <p className="text-xs text-silver/50 mt-0.5">Estacionamento proprio no local</p>
        </div>
        <div className="card text-center">
          <span className="text-2xl mb-2 block">☕</span>
          <h3 className="font-semibold text-sm text-white">Coffee Break</h3>
          <p className="text-xs text-silver/50 mt-0.5">Area de convivencia</p>
        </div>
        <div className="card text-center">
          <span className="text-2xl mb-2 block">📶</span>
          <h3 className="font-semibold text-sm text-white">Wi-Fi</h3>
          <p className="text-xs text-silver/50 mt-0.5">Rede: ConnectValley</p>
        </div>
        <div className="card text-center">
          <span className="text-2xl mb-2 block">🏢</span>
          <h3 className="font-semibold text-sm text-white">Stands</h3>
          <p className="text-xs text-silver/50 mt-0.5">Area de exposicao</p>
        </div>
      </div>
    </div>
  );
}
