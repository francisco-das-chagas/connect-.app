export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  address: string | null;
  city: string | null;
  uf: string | null;
  banner_url: string | null;
  logo_url: string | null;
  max_attendees: number | null;
  registration_open: boolean;
  status: 'upcoming' | 'live' | 'ended';
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventSession {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  speaker_name: string | null;
  speaker_title: string | null;
  speaker_photo_url: string | null;
  speaker_bio: string | null;
  track: string | null;
  room: string | null;
  start_time: string;
  end_time: string;
  session_type: 'talk' | 'workshop' | 'panel' | 'networking' | 'break';
  max_capacity: number | null;
  materials_url: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  party_id: string | null;
  user_id: string | null;
  full_name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  badge_code: string | null;
  ticket_type: 'standard' | 'general' | 'vip' | 'speaker' | 'sponsor' | 'staff' | 'admin' | 'organizer';
  checked_in: boolean;
  checked_in_at: string | null;
  networking_visible: boolean;
  networking_opt_in: boolean;
  interests: string[];
  status: 'registered' | 'confirmed' | 'cancelled' | 'no_show';
  source: string;
  created_at: string;
  updated_at: string;
}

export interface EventSponsor {
  id: string;
  event_id: string;
  party_id: string | null;
  name: string;
  description: string | null;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  video_url: string | null;
  tier: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'support';
  booth_config: Record<string, unknown>;
  materials: { name: string; url: string }[];
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  sort_order: number;
  active: boolean;
  is_active: boolean;
  created_at: string;
  // Social media & profile fields
  instagram_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  segment: string | null;
  whatsapp_phone: string | null;
}

export interface EventInteraction {
  id: string;
  event_id: string;
  attendee_id: string | null;
  sponsor_id: string | null;
  session_id: string | null;
  interaction_type: string;
  deal_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EventSessionFavorite {
  id: string;
  attendee_id: string;
  session_id: string;
  created_at: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  content: string | null;
  read_at: string | null;
  created_at: string;
  sender?: EventAttendee;
  receiver?: EventAttendee;
}

export interface EventGroupMessage {
  id: string;
  event_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'participante' | 'patrocinador';
  content: string;
  created_at: string;
}

export interface EventNotification {
  id: string;
  event_id: string;
  title: string;
  body: string;
  type: string;
  target: string;
  target_audience: string;
  sent_at: string | null;
  created_at: string;
}

export interface EventSponsorOffer {
  id: string;
  event_id: string;
  sponsor_id: string;
  title: string;
  description: string | null;
  offer_type: 'coupon' | 'download' | 'demo' | 'raffle';
  code: string | null;
  valid_until: string | null;
  max_claims: number | null;
  claims_count: number;
  active: boolean;
  created_at: string;
}

export interface EventOfferClaim {
  id: string;
  offer_id: string;
  attendee_id: string;
  claimed_at: string;
}

export interface EventGamification {
  id: string;
  event_id: string;
  attendee_id: string;
  points: number;
  visits_count: number;
  interactions_count: number;
  offers_claimed: number;
  badges: string[];
  updated_at: string;
}

export interface EventMeeting {
  id: string;
  event_id: string;
  attendee_id: string;
  sponsor_id: string;
  proposed_time: string | null;
  duration_minutes: number;
  location: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  attendee_notes: string | null;
  sponsor_notes: string | null;
  created_at: string;
  // Joined fields
  sponsor?: EventSponsor;
  attendee?: EventAttendee;
}

// Points configuration
export const GAMIFICATION_POINTS: Record<string, number> = {
  visit: 5,
  contact_request: 15,
  meeting_request: 25,
  offer_claim: 10,
  session_favorite: 5,
  qr_scan: 10,
};

export const SPONSOR_SEGMENTS = [
  'Tecnologia',
  'Finanças',
  'Contabilidade',
  'Marketing',
  'Educação',
  'Saúde',
  'Indústria',
  'Serviços',
  'Comércio',
  'Agro',
  'Outro',
] as const;

export const GAMIFICATION_BADGES = [
  { id: 'explorer', name: 'Explorador', description: 'Visitou 5 patrocinadores', icon: '🧭', field: 'visits_count' as const, threshold: 5 },
  { id: 'networker', name: 'Networker', description: 'Fez 3 contatos', icon: '🤝', field: 'interactions_count' as const, threshold: 3 },
  { id: 'vip', name: 'VIP', description: 'Alcancou 50 pontos', icon: '⭐', field: 'points' as const, threshold: 50 },
  { id: 'collector', name: 'Colecionador', description: 'Resgatou 3 ofertas', icon: '🎁', field: 'offers_claimed' as const, threshold: 3 },
  { id: 'champion', name: 'Campeao', description: 'Alcancou 100 pontos', icon: '🏆', field: 'points' as const, threshold: 100 },
];

// Tier ordering for sponsors display (ordered array)
export const SPONSOR_TIER_ORDER: string[] = [
  'diamond',
  'platinum',
  'gold',
  'silver',
  'bronze',
  'support',
];

export const SPONSOR_TIER_LABELS: Record<string, string> = {
  diamond: 'Diamante',
  platinum: 'Platina',
  gold: 'Ouro',
  silver: 'Prata',
  bronze: 'Bronze',
  support: 'Apoio',
};

export const SESSION_TYPE_LABELS: Record<string, string> = {
  talk: 'Palestra',
  workshop: 'Oficina',
  panel: 'Painel',
  networking: 'Networking',
  break: 'Intervalo',
};

export const INTEREST_OPTIONS = [
  'IA & Tecnologia',
  'Financas & Tributario',
  'Marketing Digital',
  'Gestao & Lideranca',
  'Empreendedorismo',
  'Reforma Tributaria',
  'Networking',
  'Inovacao',
];
