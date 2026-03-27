'use client';

import { useState } from 'react';
import type { ViewMode } from '@/hooks/useViewMode';
import { Eye, X, User, Settings, Building2 } from 'lucide-react';

interface Props {
  currentMode: ViewMode;
  sponsors: { id: string; name: string; logo_url: string | null }[];
  onSwitch: (mode: ViewMode, sponsorId?: string) => void;
}

export function AdminViewSwitcher({ currentMode, sponsors, onSwitch }: Props) {
  const [open, setOpen] = useState(false);

  const modeConfig: Record<ViewMode, { label: string; Icon: typeof User; color: string; bgColor: string }> = {
    participante: { label: 'Participante', Icon: User, color: 'text-cyan-400', bgColor: 'bg-cyan-600' },
    patrocinador: { label: 'Patrocinador', Icon: Building2, color: 'text-amber-400', bgColor: 'bg-amber-500' },
    admin: { label: 'Admin', Icon: Settings, color: 'text-purple-400', bgColor: 'bg-purple-600' },
  };

  const current = modeConfig[currentMode];

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-full text-white text-xs font-medium shadow-lg ${current.bgColor} hover:opacity-90 transition-opacity`}
      >
        <Eye size={14} />
        <span>{current.label}</span>
        <span className="opacity-60 text-[10px]">&#9660;</span>
      </button>

      {/* Modal de seleção */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#0a1628] w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-5 space-y-4 border-t border-white/10 sm:border sm:border-white/10 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Trocar Visão</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Opção: Participante */}
            <button
              onClick={() => {
                onSwitch('participante');
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                currentMode === 'participante'
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-white/5 hover:border-cyan-500/30'
              }`}
            >
              <User size={24} className="text-cyan-400" />
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white">Visão do Participante</p>
                <p className="text-xs text-gray-500">Programação, networking, mensagens</p>
              </div>
              {currentMode === 'participante' && <Check className="text-cyan-400" />}
            </button>

            {/* Opção: Admin */}
            <button
              onClick={() => {
                onSwitch('admin');
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                currentMode === 'admin'
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/5 hover:border-purple-500/30'
              }`}
            >
              <Settings size={24} className="text-purple-400" />
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white">Visão do Administrador</p>
                <p className="text-xs text-gray-500">Painel completo de gestão do evento</p>
              </div>
              {currentMode === 'admin' && <Check className="text-purple-400" />}
            </button>

            {/* Opção: Patrocinador */}
            {sponsors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Simular Visão de Patrocinador
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sponsors.map((sponsor) => (
                    <button
                      key={sponsor.id}
                      onClick={() => {
                        onSwitch('patrocinador', sponsor.id);
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors"
                    >
                      {sponsor.logo_url ? (
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="w-8 h-8 object-contain rounded border border-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-xs text-gray-500">
                          {sponsor.name[0]}
                        </div>
                      )}
                      <span className="text-sm text-gray-300">{sponsor.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
