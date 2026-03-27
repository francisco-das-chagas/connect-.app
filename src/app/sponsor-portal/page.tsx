'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import { useRealtime } from '@/hooks/useRealtime';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { SponsorQRScannerTab } from '@/components/sponsors/SponsorQRScanner';
import { ImageUploader } from '@/components/sponsors/ImageUploader';
import { sanitizeText, sanitizeUrl, sanitizeEmail, sanitizePhone, sanitizeCSVValue, sanitizeInt, MAX_LENGTHS } from '@/lib/sanitize';
import { getWhatsAppUrl } from '@/lib/utils';
import { SPONSOR_SEGMENTS } from '@/types';
import type { EventSponsor, EventSponsorOffer } from '@/types';

interface LeadEntry {
  id: string;
  interaction_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  attendee: {
    id: string;
    full_name: string;
    company: string | null;
    job_title: string | null;
    email: string;
    phone: string | null;
    linkedin_url: string | null;
  } | null;
}

type TabKey = 'dashboard' | 'perfil' | 'ofertas' | 'scanner';

export default function SponsorPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { attendee, loading: attendeeLoading } = useAttendee();
  const { event } = useEvent();
  const [sponsor, setSponsor] = useState<EventSponsor | null>(null);
  const [leads, setLeads] = useState<LeadEntry[]>([]);
  const [stats, setStats] = useState({ visits: 0, contacts: 0, meetings: 0, offers: 0 });
  const [loading, setLoading] = useState(true);
  const [newLeadCount, setNewLeadCount] = useState(0);
  const [filter, setFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    name: '',
    tagline: '',
    description: '',
    website_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    instagram_url: '',
    linkedin_url: '',
    facebook_url: '',
    twitter_url: '',
    whatsapp_phone: '',
    segment: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Offers state
  const [sponsorOffers, setSponsorOffers] = useState<EventSponsorOffer[]>([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<EventSponsorOffer | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    offer_type: 'coupon' as string,
    code: '',
    max_claims: '',
  });
  const [offerSaving, setOfferSaving] = useState(false);

  // Find the sponsor linked to this user
  useEffect(() => {
    if (!event || !attendee) return;

    const fetchSponsor = async () => {
      const supabase = createSupabaseBrowser();
      let sponsorData: EventSponsor | null = null;

      if (attendee.party_id) {
        const { data } = await supabase
          .from('event_sponsors')
          .select('id, event_id, party_id, name, description, tagline, logo_url, banner_url, website_url, contact_name, contact_email, contact_phone, instagram_url, linkedin_url, facebook_url, twitter_url, whatsapp_phone, segment, tier, active, sort_order')
          .eq('event_id', event.id)
          .eq('party_id', attendee.party_id)
          .maybeSingle();
        if (data) sponsorData = data as EventSponsor;
      }

      if (!sponsorData) {
        const { data } = await supabase
          .from('event_sponsors')
          .select('id, event_id, party_id, name, description, tagline, logo_url, banner_url, website_url, contact_name, contact_email, contact_phone, instagram_url, linkedin_url, facebook_url, twitter_url, whatsapp_phone, segment, tier, active, sort_order')
          .eq('event_id', event.id)
          .eq('contact_email', attendee.email)
          .maybeSingle();
        if (data) sponsorData = data as EventSponsor;
      }

      if (!sponsorData) {
        setLoading(false);
        return;
      }

      setSponsor(sponsorData);
      setProfileForm({
        name: sponsorData.name || '',
        tagline: sponsorData.tagline || '',
        description: sponsorData.description || '',
        website_url: sponsorData.website_url || '',
        contact_name: sponsorData.contact_name || '',
        contact_email: sponsorData.contact_email || '',
        contact_phone: sponsorData.contact_phone || '',
        instagram_url: sponsorData.instagram_url || '',
        linkedin_url: sponsorData.linkedin_url || '',
        facebook_url: sponsorData.facebook_url || '',
        twitter_url: sponsorData.twitter_url || '',
        whatsapp_phone: sponsorData.whatsapp_phone || '',
        segment: sponsorData.segment || '',
      });

      // Fetch interactions
      const { data: interactions } = await supabase
        .from('event_interactions')
        .select(`
          id, interaction_type, metadata, created_at,
          attendee:event_attendees!attendee_id(id, full_name, company, job_title, email, phone, linkedin_url)
        `)
        .eq('sponsor_id', sponsorData.id)
        .order('created_at', { ascending: false });

      if (interactions) {
        setLeads(interactions as unknown as LeadEntry[]);
        const visits = interactions.filter((i) => i.interaction_type === 'visit').length;
        const contacts = interactions.filter((i) => i.interaction_type === 'contact_request').length;
        const meetingsCount = interactions.filter((i) => i.interaction_type === 'meeting_request').length;
        const offersCount = interactions.filter((i) => i.interaction_type === 'offer_claim').length;
        setStats({ visits, contacts, meetings: meetingsCount, offers: offersCount });
      }

      // Fetch offers
      const { data: offers } = await supabase
        .from('event_sponsor_offers')
        .select('id, sponsor_id, title, description, offer_type, code, valid_until, max_claims, claims_count, active, created_at')
        .eq('sponsor_id', sponsorData.id)
        .order('created_at', { ascending: false });
      if (offers) setSponsorOffers(offers as EventSponsorOffer[]);

      setLoading(false);
    };

    fetchSponsor();
  }, [event, attendee]);

  // Realtime listener for new interactions
  const handleNewInteraction = useCallback(
    (payload: { new: Record<string, unknown>; eventType: string }) => {
      if (payload.eventType === 'INSERT' && sponsor) {
        const newInteraction = payload.new;
        if (newInteraction.sponsor_id === sponsor.id) {
          setNewLeadCount((c) => c + 1);
          const supabase = createSupabaseBrowser();
          supabase
            .from('event_interactions')
            .select(`
              id, interaction_type, metadata, created_at,
              attendee:event_attendees!attendee_id(id, full_name, company, job_title, email, linkedin_url)
            `)
            .eq('sponsor_id', sponsor.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) {
                setLeads(data as unknown as LeadEntry[]);
                const visits = data.filter((i) => i.interaction_type === 'visit').length;
                const contacts = data.filter((i) => i.interaction_type === 'contact_request').length;
                const meetingsCount = data.filter((i) => i.interaction_type === 'meeting_request').length;
                const offersCount = data.filter((i) => i.interaction_type === 'offer_claim').length;
                setStats({ visits, contacts, meetings: meetingsCount, offers: offersCount });
              }
            });
        }
      }
    },
    [sponsor]
  );

  useRealtime('event_interactions', undefined, handleNewInteraction);

  // === PROFILE HANDLERS ===
  const handleProfileSave = async () => {
    if (!sponsor) return;
    setProfileSaving(true);
    const supabase = createSupabaseBrowser();

    // Sanitize all profile inputs before DB write
    const { error } = await supabase
      .from('event_sponsors')
      .update({
        name: sanitizeText(profileForm.name, MAX_LENGTHS.name),
        tagline: profileForm.tagline ? sanitizeText(profileForm.tagline, MAX_LENGTHS.shortText) : null,
        description: profileForm.description ? sanitizeText(profileForm.description, MAX_LENGTHS.mediumText) : null,
        website_url: profileForm.website_url ? sanitizeUrl(profileForm.website_url) : null,
        contact_name: profileForm.contact_name ? sanitizeText(profileForm.contact_name, MAX_LENGTHS.name) : null,
        contact_email: profileForm.contact_email ? sanitizeEmail(profileForm.contact_email) : null,
        contact_phone: profileForm.contact_phone ? sanitizePhone(profileForm.contact_phone) : null,
        instagram_url: profileForm.instagram_url ? sanitizeUrl(profileForm.instagram_url) : null,
        linkedin_url: profileForm.linkedin_url ? sanitizeUrl(profileForm.linkedin_url) : null,
        facebook_url: profileForm.facebook_url ? sanitizeUrl(profileForm.facebook_url) : null,
        twitter_url: profileForm.twitter_url ? sanitizeUrl(profileForm.twitter_url) : null,
        whatsapp_phone: profileForm.whatsapp_phone ? sanitizePhone(profileForm.whatsapp_phone) : null,
        segment: profileForm.segment || null,
      })
      .eq('id', sponsor.id);

    if (!error) {
      setSponsor({ ...sponsor, ...profileForm });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileSaving(false);
  };

  // === OFFER HANDLERS ===
  const resetOfferForm = () => {
    setOfferForm({ title: '', description: '', offer_type: 'coupon', code: '', max_claims: '' });
    setEditingOffer(null);
    setShowOfferForm(false);
  };

  const handleOfferSave = async () => {
    if (!sponsor || !event || !offerForm.title) return;
    setOfferSaving(true);
    const supabase = createSupabaseBrowser();

    // Sanitize offer inputs before DB write
    const validOfferTypes = ['coupon', 'download', 'demo', 'raffle'];
    const payload = {
      event_id: event.id,
      sponsor_id: sponsor.id,
      title: sanitizeText(offerForm.title, MAX_LENGTHS.shortText),
      description: offerForm.description ? sanitizeText(offerForm.description, MAX_LENGTHS.mediumText) : null,
      offer_type: validOfferTypes.includes(offerForm.offer_type) ? offerForm.offer_type : 'coupon',
      code: offerForm.code ? sanitizeText(offerForm.code, 100) : null,
      max_claims: offerForm.max_claims ? sanitizeInt(offerForm.max_claims, 1, 100000) : null,
      active: true,
    };

    if (editingOffer) {
      await supabase
        .from('event_sponsor_offers')
        .update(payload)
        .eq('id', editingOffer.id);
    } else {
      await supabase
        .from('event_sponsor_offers')
        .insert(payload);
    }

    // Refresh offers
    const { data: offers } = await supabase
      .from('event_sponsor_offers')
      .select('id, sponsor_id, title, description, offer_type, code, valid_until, max_claims, claims_count, active, created_at')
      .eq('sponsor_id', sponsor.id)
      .order('created_at', { ascending: false });
    if (offers) setSponsorOffers(offers as EventSponsorOffer[]);

    resetOfferForm();
    setOfferSaving(false);
  };

  const toggleOfferActive = async (offer: EventSponsorOffer) => {
    const supabase = createSupabaseBrowser();
    await supabase
      .from('event_sponsor_offers')
      .update({ active: !offer.active })
      .eq('id', offer.id);
    setSponsorOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, active: !o.active } : o))
    );
  };

  const startEditOffer = (offer: EventSponsorOffer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description || '',
      offer_type: offer.offer_type,
      code: offer.code || '',
      max_claims: offer.max_claims ? String(offer.max_claims) : '',
    });
    setShowOfferForm(true);
  };

  // === EXPORT CSV ===
  // Uses sanitizeCSVValue to prevent CSV injection (formula injection attacks)
  const exportCSV = () => {
    if (!sponsor) return;
    const csvLeads = leads.filter((l) => l.interaction_type !== 'visit');
    const header = 'Nome,Empresa,Cargo,Email,LinkedIn,Tipo,Mensagem,Data\n';
    const rows = csvLeads
      .map((l) => {
        const att = l.attendee;
        const meta = l.metadata || {};
        return [
          sanitizeCSVValue(att?.full_name || ''),
          sanitizeCSVValue(att?.company || ''),
          sanitizeCSVValue(att?.job_title || ''),
          sanitizeCSVValue(att?.email || ''),
          sanitizeCSVValue(att?.linkedin_url || ''),
          sanitizeCSVValue(interactionLabels[l.interaction_type] || l.interaction_type),
          sanitizeCSVValue(String(meta.message || meta.interest || '')),
          sanitizeCSVValue(new Date(l.created_at).toLocaleString('pt-BR')),
        ].join(',');
      })
      .join('\n');

    // BOM for UTF-8 encoding in Excel
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${sponsor.name.replace(/[^\w-]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auth guard
  if (authLoading || attendeeLoading) return <PageLoading />;
  if (!user) {
    router.push('/login');
    return null;
  }

  if (loading) return <PageLoading />;

  if (!sponsor) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🔒</span>
          <h1 className="text-xl font-bold text-white mb-2">Acesso restrito</h1>
          <p className="text-silver/60 text-sm mb-4">
            Este portal e exclusivo para patrocinadores do evento.
          </p>
          <button onClick={() => router.push('/evento')} className="btn-primary">
            Voltar ao evento
          </button>
        </div>
      </div>
    );
  }

  const interactionLabels: Record<string, string> = {
    visit: 'Visita',
    contact_request: 'Contato',
    meeting_request: 'Reuniao',
    offer_claim: 'Oferta',
    material_download: 'Download',
    qr_scan: 'QR Scan',
  };

  const interactionIcons: Record<string, string> = {
    visit: '👁️',
    contact_request: '💬',
    meeting_request: '🤝',
    offer_claim: '🎁',
    material_download: '📥',
    qr_scan: '📷',
  };

  const interactionColors: Record<string, string> = {
    visit: 'bg-blue-500/20 text-blue-400',
    contact_request: 'bg-green-500/20 text-green-400',
    meeting_request: 'bg-purple-500/20 text-purple-400',
    offer_claim: 'bg-orange-500/20 text-orange-400',
    material_download: 'bg-cyan-500/20 text-cyan-400',
    qr_scan: 'bg-teal-500/20 text-teal-400',
  };

  const filteredLeads =
    filter === 'all'
      ? leads.filter((l) => l.interaction_type !== 'visit')
      : leads.filter((l) => l.interaction_type === filter);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'perfil', label: 'Meu Perfil', icon: '✏️' },
    { key: 'ofertas', label: 'Ofertas', icon: '🎁' },
    { key: 'scanner', label: 'Scanner', icon: '📷' },
  ];

  const offerTypeLabels: Record<string, string> = {
    coupon: 'Cupom',
    download: 'Download',
    demo: 'Demo',
    raffle: 'Sorteio',
  };

  return (
    <div className="min-h-screen bg-navy">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">
        <Link href="/evento" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
          ← Voltar ao evento
        </Link>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.name} className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <span className="font-bold text-accent-500">{sponsor.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-white text-lg">{sponsor.name}</h1>
              <p className="text-xs text-silver/50">Portal do Patrocinador</p>
            </div>
          </div>
          <button onClick={() => router.push('/evento')} className="text-sm text-silver/50 hover:text-silver">
            ← Evento
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-accent-500 text-navy-dark'
                  : 'bg-white/5 text-silver/60 hover:bg-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* New lead notification */}
        {newLeadCount > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-sm text-green-400 font-semibold">
              🔔 {newLeadCount} novo(s) lead(s) recebido(s)!
            </p>
          </div>
        )}

        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { label: 'Visitas', value: stats.visits, icon: '👁️', color: 'text-blue-400' },
                { label: 'Contatos', value: stats.contacts, icon: '💬', color: 'text-green-400' },
                { label: 'Reunioes', value: stats.meetings, icon: '📅', color: 'text-purple-400' },
                { label: 'Ofertas', value: stats.offers, icon: '🎁', color: 'text-orange-400' },
              ].map((stat) => (
                <div key={stat.label} className="card p-3 text-center">
                  <span className="text-lg">{stat.icon}</span>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[9px] text-silver/50">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Filters + Export */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1.5 overflow-x-auto">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'contact_request', label: 'Contatos' },
                  { key: 'meeting_request', label: 'Reunioes' },
                  { key: 'offer_claim', label: 'Ofertas' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === f.key
                        ? 'bg-accent-500 text-navy-dark'
                        : 'bg-white/5 text-silver/60 hover:bg-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-silver/60 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                CSV
              </button>
            </div>

            {/* Leads List */}
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">📭</span>
                <p className="text-silver/50 text-sm">Nenhum lead ainda.</p>
                <p className="text-silver/30 text-xs mt-1">Os leads aparecerao aqui em tempo real.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${interactionColors[lead.interaction_type] || 'bg-white/10 text-silver/60'}`}>
                        <span className="text-sm">{interactionIcons[lead.interaction_type] || '📋'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-white text-sm truncate">
                            {lead.attendee?.full_name || 'Participante'}
                          </p>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${interactionColors[lead.interaction_type]}`}>
                            {interactionLabels[lead.interaction_type] || lead.interaction_type}
                          </span>
                        </div>
                        {lead.attendee?.company && (
                          <p className="text-xs text-silver/50">
                            {lead.attendee.company}
                            {lead.attendee.job_title && ` · ${lead.attendee.job_title}`}
                          </p>
                        )}
                        {lead.metadata?.message ? (
                          <p className="text-xs text-silver/60 mt-1.5 bg-white/5 p-2 rounded-lg">
                            &ldquo;{String(lead.metadata.message)}&rdquo;
                          </p>
                        ) : null}
                        {lead.metadata?.interest ? (
                          <p className="text-xs text-silver/60 mt-1.5 bg-white/5 p-2 rounded-lg">
                            Interesse: {String(lead.metadata.interest)}
                            {lead.metadata?.notes ? ` — ${String(lead.metadata.notes)}` : ''}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-silver/30">
                            {new Date(lead.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {lead.attendee?.email && (
                            <a href={`mailto:${lead.attendee.email}`} className="text-[10px] text-accent-500 font-medium">
                              Email
                            </a>
                          )}
                          {lead.attendee?.linkedin_url && (
                            <a href={lead.attendee.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 font-medium">
                              LinkedIn
                            </a>
                          )}
                          {lead.attendee?.phone && (
                            <a
                              href={getWhatsAppUrl(lead.attendee.phone, `Ola ${lead.attendee.full_name}, tudo bem? Sou da ${sponsor.name} e vi seu interesse no Connect Valley 2026!`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ========== PERFIL TAB ========== */}
        {activeTab === 'perfil' && (
          <div className="space-y-5">
            {/* Image uploads */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Imagens</h2>
              <div className="space-y-5">
                <ImageUploader
                  sponsorId={sponsor.id}
                  type="logo"
                  currentUrl={sponsor.logo_url}
                  onUploaded={async (url) => {
                    const supabase = createSupabaseBrowser();
                    await supabase.from('event_sponsors').update({ logo_url: url }).eq('id', sponsor.id);
                    setSponsor({ ...sponsor, logo_url: url });
                  }}
                />
                <ImageUploader
                  sponsorId={sponsor.id}
                  type="banner"
                  currentUrl={sponsor.banner_url}
                  onUploaded={async (url) => {
                    const supabase = createSupabaseBrowser();
                    await supabase.from('event_sponsors').update({ banner_url: url }).eq('id', sponsor.id);
                    setSponsor({ ...sponsor, banner_url: url });
                  }}
                />
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Informacoes da empresa</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Nome da empresa *</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={profileForm.tagline}
                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="Frase de destaque da empresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Descricao</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-silver/30 focus:border-accent-500/50 focus:outline-none resize-none min-h-[120px]"
                    placeholder="Descreva sua empresa, produtos e servicos..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Website</label>
                  <input
                    type="url"
                    value={profileForm.website_url}
                    onChange={(e) => setProfileForm({ ...profileForm, website_url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="https://www.suaempresa.com.br"
                  />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Contato</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Nome do contato</label>
                  <input
                    type="text"
                    value={profileForm.contact_name}
                    onChange={(e) => setProfileForm({ ...profileForm, contact_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="Responsavel pelo stand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.contact_email}
                    onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={profileForm.contact_phone}
                    onChange={(e) => setProfileForm({ ...profileForm, contact_phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="(62) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-sm text-green-400 font-semibold">✅ Perfil atualizado com sucesso!</p>
              </div>
            )}

            <button
              onClick={handleProfileSave}
              disabled={profileSaving || !profileForm.name}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors disabled:opacity-50"
            >
              {profileSaving ? (
                <div className="w-5 h-5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
              {profileSaving ? 'Salvando...' : 'Salvar perfil'}
            </button>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Redes Sociais</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={profileForm.instagram_url}
                    onChange={(e) => setProfileForm({ ...profileForm, instagram_url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="https://instagram.com/suaempresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={profileForm.linkedin_url}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="https://linkedin.com/company/suaempresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={profileForm.facebook_url}
                    onChange={(e) => setProfileForm({ ...profileForm, facebook_url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="https://facebook.com/suaempresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">Twitter / X</label>
                  <input
                    type="url"
                    value={profileForm.twitter_url}
                    onChange={(e) => setProfileForm({ ...profileForm, twitter_url: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="https://x.com/suaempresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-silver/60 mb-1">WhatsApp (com DDD)</label>
                  <input
                    type="tel"
                    value={profileForm.whatsapp_phone}
                    onChange={(e) => setProfileForm({ ...profileForm, whatsapp_phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                    placeholder="(62) 99999-9999"
                  />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Segmento</h2>
              <select
                value={profileForm.segment}
                onChange={(e) => setProfileForm({ ...profileForm, segment: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none appearance-none"
              >
                <option value="" className="bg-navy text-silver">Selecione o segmento...</option>
                {SPONSOR_SEGMENTS.map((seg) => (
                  <option key={seg} value={seg} className="bg-navy text-white">{seg}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ========== OFERTAS TAB ========== */}
        {activeTab === 'ofertas' && (
          <div>
            {/* New/Edit Offer Form */}
            {showOfferForm ? (
              <div className="card p-5 mb-4">
                <h2 className="text-sm font-semibold text-white mb-4">
                  {editingOffer ? '✏️ Editar oferta' : '➕ Nova oferta'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-silver/60 mb-1">Titulo da oferta *</label>
                    <input
                      type="text"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                      placeholder="Ex: 20% de desconto no primeiro mes"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-silver/60 mb-1">Descricao</label>
                    <textarea
                      value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-silver/30 focus:border-accent-500/50 focus:outline-none resize-none min-h-[80px]"
                      placeholder="Detalhes da oferta..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-silver/60 mb-1">Tipo</label>
                      <select
                        value={offerForm.offer_type}
                        onChange={(e) => setOfferForm({ ...offerForm, offer_type: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none appearance-none"
                      >
                        <option value="coupon" className="bg-navy">Cupom</option>
                        <option value="download" className="bg-navy">Download</option>
                        <option value="demo" className="bg-navy">Demo</option>
                        <option value="raffle" className="bg-navy">Sorteio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-silver/60 mb-1">Limite de resgates</label>
                      <input
                        type="number"
                        value={offerForm.max_claims}
                        onChange={(e) => setOfferForm({ ...offerForm, max_claims: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                        placeholder="Ilimitado"
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-silver/60 mb-1">
                      Codigo / Link {offerForm.offer_type === 'coupon' ? '(cupom)' : offerForm.offer_type === 'download' ? '(URL)' : ''}
                    </label>
                    <input
                      type="text"
                      value={offerForm.code}
                      onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-500/50 focus:outline-none"
                      placeholder={offerForm.offer_type === 'coupon' ? 'CONECTE20' : 'https://...'}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={resetOfferForm}
                      className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-silver/70 font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleOfferSave}
                      disabled={offerSaving || !offerForm.title}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors disabled:opacity-50"
                    >
                      {offerSaving ? (
                        <div className="w-5 h-5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                      ) : null}
                      {offerSaving ? 'Salvando...' : editingOffer ? 'Atualizar' : 'Criar oferta'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowOfferForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nova oferta
              </button>
            )}

            {/* Offers List */}
            {sponsorOffers.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🎁</span>
                <p className="text-silver/50 text-sm">Nenhuma oferta criada.</p>
                <p className="text-silver/30 text-xs mt-1">Crie ofertas para atrair participantes ao seu stand.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sponsorOffers.map((offer) => (
                  <div key={offer.id} className={`card p-4 ${!offer.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white text-sm">{offer.title}</p>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                            {offerTypeLabels[offer.offer_type] || offer.offer_type}
                          </span>
                          {!offer.active && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                              Inativa
                            </span>
                          )}
                        </div>
                        {offer.description && (
                          <p className="text-xs text-silver/60 mt-0.5">{offer.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-silver/60">
                          <span>{offer.claims_count} resgate(s)</span>
                          {offer.max_claims && <span>/ {offer.max_claims} max</span>}
                          {offer.code && <span className="text-accent-500 font-medium">Codigo: {offer.code}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditOffer(offer)}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-silver/50 hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleOfferActive(offer)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            offer.active
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'bg-white/5 text-silver/60 hover:bg-white/10'
                          }`}
                          title={offer.active ? 'Desativar' : 'Ativar'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {offer.active ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== SCANNER TAB ========== */}
        {activeTab === 'scanner' && sponsor && event && (
          <SponsorQRScannerTab sponsor={sponsor} eventId={event.id} />
        )}
      </div>
    </div>
  );
}
