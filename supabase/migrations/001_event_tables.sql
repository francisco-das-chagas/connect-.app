-- =============================================
-- Connect Valley Event App — Migration
-- Novas tabelas para o app de eventos
-- As tabelas do CRM (parties, deals, contacts) sao COMPARTILHADAS
-- =============================================

-- 1. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    address TEXT,
    city TEXT,
    uf TEXT,
    banner_url TEXT,
    logo_url TEXT,
    max_attendees INT,
    registration_open BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. EVENT_SESSIONS
CREATE TABLE IF NOT EXISTS public.event_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    speaker_name TEXT,
    speaker_title TEXT,
    speaker_photo_url TEXT,
    speaker_bio TEXT,
    track TEXT,
    room TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    session_type TEXT DEFAULT 'palestra' CHECK (session_type IN ('palestra', 'workshop', 'painel', 'networking', 'intervalo')),
    max_capacity INT,
    materials_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. EVENT_ATTENDEES (link com parties do CRM)
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    party_id UUID,  -- FK para parties do CRM (nao forca constraint pois tabela pode nao existir)
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    job_title TEXT,
    photo_url TEXT,
    bio TEXT,
    linkedin_url TEXT,
    badge_code TEXT UNIQUE,
    ticket_type TEXT DEFAULT 'standard' CHECK (ticket_type IN ('standard', 'vip', 'speaker', 'sponsor', 'staff')),
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    networking_visible BOOLEAN DEFAULT true,
    interests JSONB DEFAULT '[]',
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'no_show')),
    source TEXT DEFAULT 'app',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, email)
);

-- 4. EVENT_SPONSORS (link com parties do CRM)
CREATE TABLE IF NOT EXISTS public.event_sponsors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    party_id UUID,  -- FK para parties do CRM
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    tier TEXT DEFAULT 'gold' CHECK (tier IN ('diamond', 'platinum', 'gold', 'silver', 'bronze')),
    booth_config JSONB DEFAULT '{}',
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. EVENT_INTERACTIONS (core da integracao CRM)
CREATE TABLE IF NOT EXISTS public.event_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    attendee_id UUID REFERENCES event_attendees(id),
    sponsor_id UUID REFERENCES event_sponsors(id),
    session_id UUID REFERENCES event_sessions(id),
    interaction_type TEXT NOT NULL,
    deal_id UUID,  -- FK para deals do CRM
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. EVENT_SESSION_FAVORITES
CREATE TABLE IF NOT EXISTS public.event_session_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendee_id UUID REFERENCES event_attendees(id) ON DELETE CASCADE,
    session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(attendee_id, session_id)
);

-- 7. EVENT_MESSAGES (chat entre participantes)
CREATE TABLE IF NOT EXISTS public.event_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES event_attendees(id),
    receiver_id UUID REFERENCES event_attendees(id),
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. EVENT_NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.event_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target TEXT DEFAULT 'all',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES para performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_event_sessions_event_id ON event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_start_time ON event_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_event_sessions_track ON event_sessions(track);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_email ON event_attendees(email);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_event_id ON event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_tier ON event_sponsors(tier);
CREATE INDEX IF NOT EXISTS idx_event_interactions_event_id ON event_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interactions_attendee_id ON event_interactions(attendee_id);
CREATE INDEX IF NOT EXISTS idx_event_interactions_sponsor_id ON event_interactions(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_sender ON event_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_receiver ON event_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_event_session_favorites_attendee ON event_session_favorites(attendee_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- EVENTS: qualquer um pode ler
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_all" ON events FOR SELECT TO anon, authenticated USING (true);

-- EVENT_SESSIONS: qualquer um pode ler
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_all" ON event_sessions FOR SELECT TO anon, authenticated USING (true);

-- EVENT_ATTENDEES: participante ve seus dados + networking
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendee_select_own" ON event_attendees
    FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));
CREATE POLICY "attendee_select_networking" ON event_attendees
    FOR SELECT TO authenticated
    USING (networking_visible = true);
CREATE POLICY "attendee_insert" ON event_attendees
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "attendee_update_own" ON event_attendees
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()));

-- EVENT_SPONSORS: qualquer um pode ler
ALTER TABLE event_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsors_select_all" ON event_sponsors FOR SELECT TO anon, authenticated USING (true);

-- EVENT_INTERACTIONS: participante ve suas interacoes
ALTER TABLE event_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interactions_select_own" ON event_interactions
    FOR SELECT TO authenticated
    USING (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );
CREATE POLICY "interactions_insert" ON event_interactions
    FOR INSERT TO authenticated
    WITH CHECK (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- EVENT_SESSION_FAVORITES
ALTER TABLE event_session_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select_own" ON event_session_favorites
    FOR SELECT TO authenticated
    USING (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );
CREATE POLICY "favorites_insert" ON event_session_favorites
    FOR INSERT TO authenticated
    WITH CHECK (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );
CREATE POLICY "favorites_delete" ON event_session_favorites
    FOR DELETE TO authenticated
    USING (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- EVENT_MESSAGES: remetente e destinatario podem ler
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON event_messages
    FOR SELECT TO authenticated
    USING (
        sender_id IN (SELECT id FROM event_attendees WHERE user_id = (select auth.uid()))
        OR receiver_id IN (SELECT id FROM event_attendees WHERE user_id = (select auth.uid()))
    );
CREATE POLICY "messages_insert" ON event_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id IN (SELECT id FROM event_attendees WHERE user_id = (select auth.uid()))
    );
CREATE POLICY "messages_update_read" ON event_messages
    FOR UPDATE TO authenticated
    USING (
        receiver_id IN (SELECT id FROM event_attendees WHERE user_id = (select auth.uid()))
    );

-- EVENT_NOTIFICATIONS: qualquer autenticado pode ler
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_all" ON event_notifications
    FOR SELECT TO authenticated
    USING (true);

-- =============================================
-- ENABLE REALTIME para chat
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE event_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE event_notifications;

-- =============================================
-- SEED: Criar evento Connect Valley 2026
-- =============================================
INSERT INTO events (name, slug, description, start_date, end_date, location, address, city, uf, status, registration_open)
VALUES (
    'Connect Valley 2026',
    'connect-valley-2026',
    'O maior evento de negocios e tecnologia do Centro-Oeste. Conectando profissionais, empresas e conhecimento.',
    '2026-06-15T08:00:00-03:00',
    '2026-06-17T18:00:00-03:00',
    'Centro de Convencoes de Goiania',
    'Av. Cultura, 1000 - Setor Central',
    'Goiania',
    'GO',
    'upcoming',
    true
) ON CONFLICT (slug) DO NOTHING;
