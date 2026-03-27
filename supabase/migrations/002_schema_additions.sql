-- =============================================
-- Connect Valley Event App — Migration V2
-- Adiciona campos extras para alinhar com o frontend
-- =============================================

-- EVENT_ATTENDEES: campos extras
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS networking_opt_in BOOLEAN DEFAULT true;

-- Sincronizar: networking_opt_in = networking_visible (mantemos ambos para compatibilidade)
UPDATE event_attendees SET networking_opt_in = networking_visible WHERE networking_opt_in IS NULL;

-- EVENT_ATTENDEES: ticket_type expandido para incluir admin/organizer
ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS event_attendees_ticket_type_check;
ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_ticket_type_check
    CHECK (ticket_type IN ('standard', 'general', 'vip', 'speaker', 'sponsor', 'staff', 'admin', 'organizer'));

-- EVENT_SPONSORS: campos extras para stand virtual
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]';
ALTER TABLE event_sponsors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Sincronizar: is_active = active (mantemos ambos para compatibilidade)
UPDATE event_sponsors SET is_active = active WHERE is_active IS NULL;

-- EVENT_SPONSORS: tier expandido para incluir 'support'
ALTER TABLE event_sponsors DROP CONSTRAINT IF EXISTS event_sponsors_tier_check;
ALTER TABLE event_sponsors ADD CONSTRAINT event_sponsors_tier_check
    CHECK (tier IN ('diamond', 'platinum', 'gold', 'silver', 'bronze', 'support'));

-- EVENT_MESSAGES: renomear 'message' para 'content' (adicionar coluna se nao existe)
ALTER TABLE event_messages ADD COLUMN IF NOT EXISTS content TEXT;
-- Copiar dados existentes
UPDATE event_messages SET content = message WHERE content IS NULL AND message IS NOT NULL;

-- EVENT_NOTIFICATIONS: campos extras
ALTER TABLE event_notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';
ALTER TABLE event_notifications ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all';

-- Sincronizar: target_audience = target
UPDATE event_notifications SET target_audience = target WHERE target_audience IS NULL;

-- RLS: admin/organizer pode ver todos os attendees (para o admin dashboard)
CREATE POLICY IF NOT EXISTS "admin_select_all_attendees" ON event_attendees
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- RLS: admin pode inserir/update notifications
CREATE POLICY IF NOT EXISTS "admin_manage_notifications" ON event_notifications
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- RLS: admin pode gerenciar sessoes
CREATE POLICY IF NOT EXISTS "admin_manage_sessions" ON event_sessions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- RLS: admin pode ver todas as interacoes (para relatorio patrocinadores)
CREATE POLICY IF NOT EXISTS "admin_view_all_interactions" ON event_interactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );
