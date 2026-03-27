'use client';

import { useState } from 'react';
import { useSponsorView } from '@/hooks/useSponsorView';
import { createSupabaseBrowser } from '@/lib/supabase';
import { sanitizeText, MAX_LENGTHS } from '@/lib/sanitize';
import { BarChart3, Users, Gift, CalendarCheck, Building2, Check, X, Clock, ExternalLink } from 'lucide-react';

type SponsorTab = 'dashboard' | 'leads' | 'ofertas' | 'reunioes' | 'estande';

interface Props {
  eventId: string;
  sponsorId: string;
}

export function SponsorView({ eventId, sponsorId }: Props) {
  const [activeTab, setActiveTab] = useState<SponsorTab>('dashboard');
  const { data, loading, error } = useSponsorView(eventId, sponsorId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030816] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030816] flex items-center justify-center p-4">
        <p className="text-red-400 text-sm text-center">{error ?? 'Erro ao carregar dados.'}</p>
      </div>
    );
  }

  const tabs: { id: SponsorTab; label: string; Icon: typeof BarChart3 }[] = [
    { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
    { id: 'leads', label: 'Leads', Icon: Users },
    { id: 'ofertas', label: 'Ofertas', Icon: Gift },
    { id: 'reunioes', label: 'Reuniões', Icon: CalendarCheck },
    { id: 'estande', label: 'Estande', Icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-[#030816] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          {data.sponsor.logo_url ? (
            <img
              src={data.sponsor.logo_url}
              alt={data.sponsor.name}
              className="h-10 w-10 object-contain rounded-lg border border-white/10"
            />
          ) : (
            <div className="h-10 w-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 font-semibold">
              {data.sponsor.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{data.sponsor.name}</p>
            <p className="text-xs text-gray-400">{data.event.name}</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              data.sponsor.tier === 'diamond'
                ? 'bg-blue-500/20 text-blue-400'
                : data.sponsor.tier === 'platinum'
                  ? 'bg-gray-500/20 text-gray-300'
                  : data.sponsor.tier === 'gold'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-green-500/20 text-green-400'
            }`}
          >
            {data.sponsor.tier?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pb-20">
        {activeTab === 'dashboard' && <DashboardTab metrics={data.metrics} />}
        {activeTab === 'leads' && <LeadsTab leads={data.leads} />}
        {activeTab === 'ofertas' && (
          <OfertasTab offers={data.offers} sponsorId={sponsorId} eventId={eventId} />
        )}
        {activeTab === 'reunioes' && <ReunioesTab meetings={data.meetings} sponsorId={sponsorId} />}
        {activeTab === 'estande' && <EstandeTab sponsor={data.sponsor} />}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-white/10 px-2 py-2 flex justify-around z-50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab({ metrics }: { metrics: { totalVisits: number; totalLeads: number; offersClaimed: number; meetingsConfirmed: number } }) {
  const cards = [
    { label: 'Visitas ao Estande', value: metrics.totalVisits, Icon: Users, color: 'cyan' },
    { label: 'Leads Coletados', value: metrics.totalLeads, Icon: Users, color: 'green' },
    { label: 'Ofertas Resgatadas', value: metrics.offersClaimed, Icon: Gift, color: 'amber' },
    { label: 'Reuniões Confirmadas', value: metrics.meetingsConfirmed, Icon: Check, color: 'purple' },
  ];
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="p-4 grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl p-4 border ${colorMap[card.color]}`}>
          <card.Icon size={24} className="mb-2 opacity-60" />
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-xs mt-0.5 opacity-80">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Leads ─── */
function LeadsTab({ leads }: { leads: { id: string; created_at: string; attendee: { id: string; full_name: string; email: string; company: string | null; job_title: string | null; photo_url: string | null; linkedin_url: string | null } | null }[] }) {
  return (
    <div className="p-4 space-y-2">
      <p className="text-sm font-medium text-gray-400 mb-3">{leads.length} leads coletados</p>
      {leads.map((lead) => (
        <div key={lead.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          {lead.attendee?.photo_url ? (
            <img src={lead.attendee.photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-medium text-sm">
              {lead.attendee?.full_name?.[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{lead.attendee?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">
              {lead.attendee?.company}
              {lead.attendee?.job_title && ` · ${lead.attendee.job_title}`}
            </p>
            <p className="text-xs text-gray-600">{lead.attendee?.email}</p>
          </div>
          {lead.attendee?.linkedin_url && (
            <a
              href={lead.attendee.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 flex-shrink-0"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      ))}
      {leads.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Nenhum lead coletado ainda.</p>
      )}
    </div>
  );
}

/* ─── Ofertas ─── */
function OfertasTab({
  offers,
  sponsorId,
  eventId,
}: {
  offers: { id: string; title: string; description: string | null; offer_type: string; code: string | null; claims_count: number; max_claims: number | null; active: boolean; valid_until: string | null; created_at: string }[];
  sponsorId: string;
  eventId: string;
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return;
    const supabase = createSupabaseBrowser();
    await supabase.from('event_sponsor_offers').insert({
      event_id: eventId,
      sponsor_id: sponsorId,
      title: sanitizeText(title, MAX_LENGTHS.name),
      description: sanitizeText(description, MAX_LENGTHS.mediumText),
    });
    setTitle('');
    setDescription('');
    setCreating(false);
    // Reload would happen via parent refetch
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-400">{offers.length} ofertas</p>
        <button
          onClick={() => setCreating(!creating)}
          className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors"
        >
          + Nova Oferta
        </button>
      </div>

      {creating && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Título da oferta"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50"
          />
          <textarea
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Criar
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 border border-white/10 text-gray-400 text-sm py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {offers.map((offer) => (
        <div key={offer.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{offer.title}</p>
              {offer.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{offer.description}</p>
              )}
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                offer.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {offer.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{offer.claims_count} resgates</span>
            {offer.max_claims && <span>/ {offer.max_claims} máx</span>}
            {offer.code && <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{offer.code}</span>}
          </div>
        </div>
      ))}
      {offers.length === 0 && !creating && (
        <p className="text-sm text-gray-500 text-center py-8">Nenhuma oferta criada.</p>
      )}
    </div>
  );
}

/* ─── Reuniões ─── */
function ReunioesTab({
  meetings,
  sponsorId,
}: {
  meetings: { id: string; proposed_time: string | null; duration_minutes: number; location: string | null; status: string; attendee_notes: string | null; sponsor_notes: string | null; created_at: string; attendee: { full_name: string; email: string; company: string | null; photo_url: string | null } | null }[];
  sponsorId: string;
}) {
  const updateStatus = async (meetingId: string, status: 'confirmed' | 'cancelled') => {
    const supabase = createSupabaseBrowser();
    await supabase.from('event_meetings').update({ status }).eq('id', meetingId);
  };

  return (
    <div className="p-4 space-y-2">
      <p className="text-sm font-medium text-gray-400 mb-3">{meetings.length} reuniões</p>
      {meetings.map((meeting) => (
        <div key={meeting.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-3">
            {meeting.attendee?.photo_url ? (
              <img src={meeting.attendee.photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-medium text-sm">
                {meeting.attendee?.full_name?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{meeting.attendee?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{meeting.attendee?.company}</p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                meeting.status === 'confirmed'
                  ? 'bg-green-500/20 text-green-400'
                  : meeting.status === 'cancelled'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {meeting.status === 'confirmed' ? 'Confirmada' : meeting.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
            </span>
          </div>
          {meeting.proposed_time && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>
                {new Date(meeting.proposed_time).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })}{' '}
                às{' '}
                {new Date(meeting.proposed_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' · '}
                {meeting.duration_minutes}min
              </span>
            </div>
          )}
          {meeting.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => updateStatus(meeting.id, 'confirmed')}
                className="flex-1 flex items-center justify-center gap-1 bg-green-500/20 text-green-400 text-xs py-1.5 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <Check size={14} /> Confirmar
              </button>
              <button
                onClick={() => updateStatus(meeting.id, 'cancelled')}
                className="flex-1 flex items-center justify-center gap-1 bg-red-500/20 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <X size={14} /> Recusar
              </button>
            </div>
          )}
        </div>
      ))}
      {meetings.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Nenhuma reunião agendada.</p>
      )}
    </div>
  );
}

/* ─── Estande ─── */
function EstandeTab({ sponsor }: { sponsor: { name: string; description: string | null; tagline: string | null; banner_url: string | null; website_url: string | null; instagram_url: string | null; linkedin_url: string | null; whatsapp_phone: string | null } }) {
  return (
    <div className="p-4 space-y-4">
      {sponsor.banner_url && (
        <img
          src={sponsor.banner_url}
          alt={sponsor.name}
          className="w-full h-40 object-cover rounded-xl"
        />
      )}
      <div>
        <h2 className="text-base font-semibold">{sponsor.name}</h2>
        {sponsor.tagline && <p className="text-sm text-gray-400 mt-1">{sponsor.tagline}</p>}
        {sponsor.description && <p className="text-sm text-gray-500 mt-2">{sponsor.description}</p>}
      </div>
      <div className="space-y-2">
        {sponsor.website_url && (
          <a
            href={sponsor.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            <ExternalLink size={14} /> Website
          </a>
        )}
        {sponsor.instagram_url && (
          <a
            href={sponsor.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            <ExternalLink size={14} /> Instagram
          </a>
        )}
        {sponsor.linkedin_url && (
          <a
            href={sponsor.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            <ExternalLink size={14} /> LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
