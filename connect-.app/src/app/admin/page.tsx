'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';

interface DashboardStats {
  totalAttendees: number;
  checkedIn: number;
  totalSessions: number;
  totalSponsors: number;
  totalInteractions: number;
  totalMessages: number;
  recentRegistrations: number;
  // Business metrics
  totalLeads: number;
  totalMeetings: number;
  totalOffersClaimed: number;
  totalDeals: number;
  // 24h trends
  attendees24h: number;
  checkedIn24h: number;
  sessions24h: number;
  sponsors24h: number;
  leads24h: number;
  meetings24h: number;
  offers24h: number;
  deals24h: number;
}

interface SponsorEngagement {
  id: string;
  name: string;
  tier: string;
  visits: number;
  leads: number;
  meetings: number;
}

export default function AdminDashboard() {
  const { event } = useEvent();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sponsorRanking, setSponsorRanking] = useState<SponsorEngagement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    Promise.all([
      supabase
        .from('event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id),
      supabase
        .from('event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .not('checked_in_at', 'is', null),
      supabase
        .from('event_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id),
      supabase
        .from('event_sponsors')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id),
      supabase
        .from('event_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id),
      supabase
        .from('event_messages')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id),
      supabase
        .from('event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      // Business metrics
      supabase
        .from('event_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('interaction_type', 'contact_request'),
      supabase
        .from('event_meetings')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id),
      supabase
        .from('event_offer_claims')
        .select('id, offer_id', { count: 'exact', head: true }),
      supabase
        .from('event_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .not('deal_id', 'is', null),
      // 24h trend queries
      supabase
        .from('event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .gte('checked_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('event_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('event_sponsors')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('event_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('interaction_type', 'contact_request')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('event_meetings')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('event_offer_claims')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('event_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .not('deal_id', 'is', null)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]).then(
      ([attendees, checkedIn, sessions, sponsors, interactions, messages, recent, leads, meetings, offers, deals, checkedIn24h, sessions24h, sponsors24h, leads24h, meetings24h, offers24h, deals24h]) => {
        setStats({
          totalAttendees: attendees.count || 0,
          checkedIn: checkedIn.count || 0,
          totalSessions: sessions.count || 0,
          totalSponsors: sponsors.count || 0,
          totalInteractions: interactions.count || 0,
          totalMessages: messages.count || 0,
          recentRegistrations: recent.count || 0,
          totalLeads: leads.count || 0,
          totalMeetings: meetings.count || 0,
          totalOffersClaimed: offers.count || 0,
          totalDeals: deals.count || 0,
          attendees24h: recent.count || 0,
          checkedIn24h: checkedIn24h.count || 0,
          sessions24h: sessions24h.count || 0,
          sponsors24h: sponsors24h.count || 0,
          leads24h: leads24h.count || 0,
          meetings24h: meetings24h.count || 0,
          offers24h: offers24h.count || 0,
          deals24h: deals24h.count || 0,
        });
        setLoading(false);
      }
    );

    // Sponsor engagement ranking
    supabase
      .from('event_sponsors')
      .select('id, name, tier')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(async ({ data: sponsorsData }) => {
        if (!sponsorsData) return;

        const engagements: SponsorEngagement[] = [];
        for (const sp of sponsorsData) {
          const [visits, leads, mtgs] = await Promise.all([
            supabase.from('event_interactions').select('id', { count: 'exact', head: true }).eq('sponsor_id', sp.id).eq('interaction_type', 'visit'),
            supabase.from('event_interactions').select('id', { count: 'exact', head: true }).eq('sponsor_id', sp.id).eq('interaction_type', 'contact_request'),
            supabase.from('event_meetings').select('id', { count: 'exact', head: true }).eq('sponsor_id', sp.id),
          ]);
          engagements.push({
            ...sp,
            visits: visits.count || 0,
            leads: leads.count || 0,
            meetings: mtgs.count || 0,
          });
        }

        // Sort by total engagement (leads + meetings)
        engagements.sort((a, b) => (b.leads + b.meetings) - (a.leads + a.meetings));
        setSponsorRanking(engagements.slice(0, 10));
      });
  }, [event]);

  if (loading) return <PageLoading />;
  if (!stats) return null;

  const generalCards = [
    { label: 'Total Inscritos', value: stats.totalAttendees, icon: '👥', color: 'bg-blue-500/20 text-blue-400', recent24h: stats.attendees24h },
    {
      label: 'Check-ins', value: stats.checkedIn, icon: '✅', color: 'bg-green-500/20 text-green-400',
      sub: stats.totalAttendees > 0 ? `${Math.round((stats.checkedIn / stats.totalAttendees) * 100)}%` : '0%',
      recent24h: stats.checkedIn24h,
    },
    { label: 'Sessoes', value: stats.totalSessions, icon: '📅', color: 'bg-purple-500/20 text-purple-400', recent24h: stats.sessions24h },
    { label: 'Patrocinadores', value: stats.totalSponsors, icon: '🏢', color: 'bg-accent-500/20 text-accent-500', recent24h: stats.sponsors24h },
  ];

  const businessCards = [
    { label: 'Leads Captados', value: stats.totalLeads, icon: '💬', color: 'bg-green-500/20 text-green-400', recent24h: stats.leads24h },
    { label: 'Reunioes Agendadas', value: stats.totalMeetings, icon: '📅', color: 'bg-purple-500/20 text-purple-400', recent24h: stats.meetings24h },
    { label: 'Ofertas Resgatadas', value: stats.totalOffersClaimed, icon: '🎁', color: 'bg-orange-500/20 text-orange-400', recent24h: stats.offers24h },
    { label: 'Deals no CRM', value: stats.totalDeals, icon: '💰', color: 'bg-yellow-500/20 text-yellow-400', recent24h: stats.deals24h },
  ];

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        {stats.recentRegistrations > 0 && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
            +{stats.recentRegistrations} hoje
          </span>
        )}
      </div>

      {/* General Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {generalCards.map((card) => (
          <div key={card.label} className={`p-4 rounded-2xl ${card.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              {card.sub && <span className="text-xs font-medium opacity-75">{card.sub}</span>}
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs opacity-75 mt-0.5">{card.label}</p>
            {card.recent24h > 0 && (
              <p className="text-[10px] text-green-400 mt-1 font-medium">+{card.recent24h} nas ultimas 24h</p>
            )}
          </div>
        ))}
      </div>

      {/* Business Metrics */}
      <h2 className="text-sm font-semibold text-white mb-3">📊 Metricas de Negocios</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {businessCards.map((card) => (
          <div key={card.label} className={`p-4 rounded-2xl ${card.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs opacity-75 mt-0.5">{card.label}</p>
            {card.recent24h > 0 && (
              <p className="text-[10px] text-green-400 mt-1 font-medium">+{card.recent24h} nas ultimas 24h</p>
            )}
          </div>
        ))}
      </div>

      {/* Sponsor Engagement Ranking */}
      {sponsorRanking.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">🏆 Engajamento por Patrocinador</h2>
          <div className="space-y-2">
            {sponsorRanking.map((sp, i) => (
              <div key={sp.id} className="card p-3 flex items-center gap-3">
                <span className="text-sm font-bold text-silver/60 w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{sp.name}</p>
                  <p className="text-[10px] text-silver/60 capitalize">{sp.tier}</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-blue-400" title="Visitas">👁️ {sp.visits}</span>
                  <span className="text-green-400" title="Leads">💬 {sp.leads}</span>
                  <span className="text-purple-400" title="Reunioes">📅 {sp.meetings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold text-white mb-3">Acoes Rapidas</h2>
      <div className="grid grid-cols-2 gap-3">
        <a href="/admin/sessoes" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center">
          <span className="text-2xl block mb-1">➕</span>
          <span className="text-xs font-medium text-silver/80">Nova Sessao</span>
        </a>
        <a href="/admin/push" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center">
          <span className="text-2xl block mb-1">📢</span>
          <span className="text-xs font-medium text-silver/80">Enviar Push</span>
        </a>
        <a href="/admin/participantes" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center">
          <span className="text-2xl block mb-1">📋</span>
          <span className="text-xs font-medium text-silver/80">Lista Presenca</span>
        </a>
        <a href="/sponsor-portal" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center">
          <span className="text-2xl block mb-1">🏢</span>
          <span className="text-xs font-medium text-silver/80">Portal Sponsor</span>
        </a>
      </div>
    </div>
  );
}
