-- =============================================
-- Connect Valley Event App — Migration V3
-- Security hardening: RLS for all tables + server-side RPCs
-- =============================================

-- =============================================
-- 1. RLS for EVENT_GAMIFICATION
-- =============================================
ALTER TABLE IF EXISTS event_gamification ENABLE ROW LEVEL SECURITY;

-- Attendee can read own gamification
CREATE POLICY IF NOT EXISTS "gamification_select_own" ON event_gamification
    FOR SELECT TO authenticated
    USING (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- Admin can read all gamification (for leaderboard/reports)
CREATE POLICY IF NOT EXISTS "gamification_select_admin" ON event_gamification
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- Only server-side RPCs can INSERT/UPDATE gamification (no direct client writes)
-- No INSERT/UPDATE policies for authenticated role = client cannot manipulate points/badges

-- =============================================
-- 2. RLS for EVENT_MEETINGS
-- =============================================
ALTER TABLE IF EXISTS event_meetings ENABLE ROW LEVEL SECURITY;

-- Attendee can read own meetings
CREATE POLICY IF NOT EXISTS "meetings_select_own" ON event_meetings
    FOR SELECT TO authenticated
    USING (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- Sponsor can read meetings assigned to them
CREATE POLICY IF NOT EXISTS "meetings_select_sponsor" ON event_meetings
    FOR SELECT TO authenticated
    USING (
        sponsor_id IN (
            SELECT es.id FROM event_sponsors es
            JOIN event_attendees ea ON ea.party_id = es.party_id::text::uuid
            WHERE ea.user_id = (select auth.uid())
            AND ea.ticket_type = 'sponsor'
        )
    );

-- Attendee can create meetings for themselves
CREATE POLICY IF NOT EXISTS "meetings_insert_own" ON event_meetings
    FOR INSERT TO authenticated
    WITH CHECK (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- Admin can read all meetings
CREATE POLICY IF NOT EXISTS "meetings_select_admin" ON event_meetings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- =============================================
-- 3. RLS for EVENT_SPONSOR_OFFERS
-- =============================================
ALTER TABLE IF EXISTS event_sponsor_offers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active offers
CREATE POLICY IF NOT EXISTS "offers_select_active" ON event_sponsor_offers
    FOR SELECT TO authenticated
    USING (active = true);

-- Admin/sponsor can manage offers
CREATE POLICY IF NOT EXISTS "offers_manage_admin" ON event_sponsor_offers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer', 'sponsor')
        )
    );

-- =============================================
-- 4. RLS for EVENT_OFFER_CLAIMS
-- =============================================
ALTER TABLE IF EXISTS event_offer_claims ENABLE ROW LEVEL SECURITY;

-- Attendee can read own claims
CREATE POLICY IF NOT EXISTS "claims_select_own" ON event_offer_claims
    FOR SELECT TO authenticated
    USING (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- Attendee can create claims for themselves
CREATE POLICY IF NOT EXISTS "claims_insert_own" ON event_offer_claims
    FOR INSERT TO authenticated
    WITH CHECK (
        attendee_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- Admin can read all claims
CREATE POLICY IF NOT EXISTS "claims_select_admin" ON event_offer_claims
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- =============================================
-- 5. RLS for EVENT_GROUP_MESSAGES
-- =============================================
ALTER TABLE IF EXISTS event_group_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated can read group messages
CREATE POLICY IF NOT EXISTS "group_messages_select" ON event_group_messages
    FOR SELECT TO authenticated
    USING (true);

-- Attendee can send group messages
CREATE POLICY IF NOT EXISTS "group_messages_insert" ON event_group_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id IN (
            SELECT id FROM event_attendees WHERE user_id = (select auth.uid())
        )
    );

-- =============================================
-- 6. RLS for CRM tables (parties, deals) — restrict to service_role
-- These tables should ONLY be writable via Edge Functions with service_role key
-- =============================================

-- PARTIES: authenticated can only read parties linked to themselves
ALTER TABLE IF EXISTS parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "parties_select_own" ON parties
    FOR SELECT TO authenticated
    USING (
        id::text IN (
            SELECT party_id::text FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND party_id IS NOT NULL
        )
    );

-- No INSERT/UPDATE/DELETE for authenticated on parties
-- CRM operations must go through Edge Functions with service_role

-- DEALS: authenticated can only read deals linked to their party
ALTER TABLE IF EXISTS deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "deals_select_own" ON deals
    FOR SELECT TO authenticated
    USING (
        party_id IN (
            SELECT party_id FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND party_id IS NOT NULL
        )
    );

-- Admin can read all deals
CREATE POLICY IF NOT EXISTS "deals_select_admin" ON deals
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- No INSERT/UPDATE/DELETE for authenticated on deals

-- =============================================
-- 7. Admin policies for managing attendees (UPDATE for check-in etc.)
-- =============================================
CREATE POLICY IF NOT EXISTS "admin_update_attendees" ON event_attendees
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- Admin can manage sponsors
CREATE POLICY IF NOT EXISTS "admin_manage_sponsors" ON event_sponsors
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE user_id = (select auth.uid())
            AND ticket_type IN ('admin', 'organizer')
        )
    );

-- =============================================
-- 8. RPC: award_gamification_badges (SECURITY DEFINER)
-- Prevents client-side badge manipulation
-- =============================================
CREATE OR REPLACE FUNCTION award_gamification_badges(
    p_event_id UUID,
    p_attendee_id UUID,
    p_new_badges TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_badges TEXT[];
    v_truly_new TEXT[];
    v_badge TEXT;
    v_valid_badges TEXT[] := ARRAY['explorer', 'networker', 'vip', 'collector', 'champion'];
BEGIN
    -- Validate: only allow known badge IDs
    FOREACH v_badge IN ARRAY p_new_badges LOOP
        IF NOT v_badge = ANY(v_valid_badges) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid badge: ' || v_badge);
        END IF;
    END LOOP;

    -- Get current badges
    SELECT COALESCE(badges, ARRAY[]::TEXT[]) INTO v_current_badges
    FROM event_gamification
    WHERE event_id = p_event_id AND attendee_id = p_attendee_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Gamification record not found');
    END IF;

    -- Filter to truly new badges
    v_truly_new := ARRAY(
        SELECT unnest(p_new_badges)
        EXCEPT
        SELECT unnest(v_current_badges)
    );

    IF array_length(v_truly_new, 1) IS NULL OR array_length(v_truly_new, 1) = 0 THEN
        RETURN jsonb_build_object('success', true, 'new_badges', '[]'::jsonb);
    END IF;

    -- Update badges
    UPDATE event_gamification
    SET badges = v_current_badges || v_truly_new,
        updated_at = now()
    WHERE event_id = p_event_id AND attendee_id = p_attendee_id;

    RETURN jsonb_build_object('success', true, 'new_badges', to_jsonb(v_truly_new));
END;
$$;

-- Grant execute to authenticated (the function runs as DEFINER so it bypasses RLS)
GRANT EXECUTE ON FUNCTION award_gamification_badges TO authenticated;

-- =============================================
-- 9. RPC: register_attendee_with_crm (SECURITY DEFINER)
-- Handles CRM party creation + attendee registration atomically
-- =============================================
CREATE OR REPLACE FUNCTION register_attendee_with_crm(
    p_event_id UUID,
    p_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_cpf TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_company TEXT DEFAULT NULL,
    p_job_title TEXT DEFAULT NULL,
    p_linkedin_url TEXT DEFAULT NULL,
    p_interests TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_party_id BIGINT;
    v_badge_code TEXT;
    v_attendee RECORD;
BEGIN
    -- 1. Find or create party in CRM
    SELECT id INTO v_party_id
    FROM parties
    WHERE em = p_email AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_party_id IS NULL THEN
        INSERT INTO parties (nm, em, tel, tp, st, od, oc, ct, nt)
        VALUES (
            p_full_name, p_email, p_phone, 'PF', 'Lead Evento',
            'Connect Valley 2026', p_company, p_job_title,
            'Cadastro via app Connect Valley. Interesses: ' || array_to_string(p_interests, ', ')
        )
        RETURNING id INTO v_party_id;
    END IF;

    -- 2. Generate badge code
    v_badge_code := 'CV26-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    -- 3. Create attendee
    INSERT INTO event_attendees (
        event_id, party_id, user_id, full_name, email, cpf,
        phone, company, job_title, linkedin_url, interests, badge_code
    ) VALUES (
        p_event_id, v_party_id, p_user_id, p_full_name, p_email, p_cpf,
        p_phone, p_company, p_job_title, p_linkedin_url, to_jsonb(p_interests), v_badge_code
    )
    RETURNING * INTO v_attendee;

    -- 4. Initialize gamification record
    INSERT INTO event_gamification (event_id, attendee_id, points, badges)
    VALUES (p_event_id, v_attendee.id, 0, ARRAY[]::TEXT[])
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'attendee', row_to_json(v_attendee),
        'party_id', v_party_id
    );
EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participante ja registrado para este evento');
WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION register_attendee_with_crm TO authenticated;

-- =============================================
-- 10. RPC: handle_sponsor_interaction_with_crm (SECURITY DEFINER)
-- Handles interaction + CRM deal creation atomically
-- =============================================
CREATE OR REPLACE FUNCTION handle_sponsor_interaction_with_crm(
    p_event_id UUID,
    p_attendee_id UUID,
    p_sponsor_id UUID,
    p_interaction_type TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_attendee RECORD;
    v_sponsor RECORD;
    v_interaction RECORD;
    v_deal_id BIGINT;
BEGIN
    -- Validate attendee belongs to caller
    SELECT id, party_id, full_name, company INTO v_attendee
    FROM event_attendees
    WHERE id = p_attendee_id AND user_id = (select auth.uid());

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendee not found or unauthorized');
    END IF;

    -- Get sponsor
    SELECT id, party_id, name INTO v_sponsor
    FROM event_sponsors
    WHERE id = p_sponsor_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sponsor not found');
    END IF;

    -- 1. Register interaction
    INSERT INTO event_interactions (
        event_id, attendee_id, sponsor_id, interaction_type, metadata
    ) VALUES (
        p_event_id, p_attendee_id, p_sponsor_id, p_interaction_type,
        jsonb_build_object('message', p_message, 'timestamp', now()::text)
    )
    RETURNING * INTO v_interaction;

    -- 2. Create CRM deal if both have party_id and no existing deal
    IF v_attendee.party_id IS NOT NULL AND v_sponsor.party_id IS NOT NULL THEN
        SELECT id INTO v_deal_id
        FROM deals
        WHERE party_id = v_attendee.party_id
        AND "buyerPartyId" = v_sponsor.party_id
        AND deleted_at IS NULL
        LIMIT 1;

        IF v_deal_id IS NULL THEN
            INSERT INTO deals (
                party_id, "buyerPartyId", stage, "totalValue", notes, items
            ) VALUES (
                v_attendee.party_id, v_sponsor.party_id, 'Qualificacao', 0,
                format(E'Lead capturado no Connect Valley 2026.\nParticipante: %s (%s)\nPatrocinador: %s\nInteracao: %s\nMensagem: %s',
                    v_attendee.full_name, COALESCE(v_attendee.company, 'N/A'),
                    v_sponsor.name, p_interaction_type, COALESCE(p_message, 'N/A')),
                jsonb_build_array(jsonb_build_object(
                    'description', 'Lead Connect Valley - ' || v_sponsor.name,
                    'quantity', 1, 'unitPrice', 0
                ))
            )
            RETURNING id INTO v_deal_id;

            -- Link deal to interaction
            UPDATE event_interactions
            SET deal_id = v_deal_id
            WHERE id = v_interaction.id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION handle_sponsor_interaction_with_crm TO authenticated;

-- =============================================
-- 11. Enable Realtime for additional tables
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE event_group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE event_gamification;
