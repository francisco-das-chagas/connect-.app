# PLANO DE CONTINGENCIA E RESOLUCAO — Connect Valley 2026

**Data:** 2026-03-07
**Baseado em:** Auditoria completa de seguranca, UX, usabilidade e funcionalidades

---

## PRIORIDADE 1 — EMERGENCIAL (Seguranca Critica)
**Prazo: Imediato (1-2 dias)**

### 1.1 Adicionar RLS nas 8 tabelas desprotegidas

**Problema:** Qualquer usuario autenticado pode ler/escrever em tabelas criticas sem restricao.

**Migracao SQL:**

```sql
-- event_group_messages (ja tem RLS habilitado mas policies podem nao estar ativas)
-- Reforcar: SELECT por evento, INSERT apenas com proprio sender_id
DROP POLICY IF EXISTS "group_msg_select" ON event_group_messages;
CREATE POLICY "group_msg_select" ON event_group_messages
  FOR SELECT USING (
    event_id IN (SELECT event_id FROM event_attendees WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "group_msg_insert" ON event_group_messages;
CREATE POLICY "group_msg_insert" ON event_group_messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM event_attendees WHERE user_id = auth.uid())
    AND event_id IN (SELECT event_id FROM event_attendees WHERE user_id = auth.uid())
  );

-- event_sponsor_offers
ALTER TABLE event_sponsor_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_select_active" ON event_sponsor_offers
  FOR SELECT USING (active = true OR sponsor_id IN (
    SELECT id FROM event_sponsors WHERE party_id = auth.uid() OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));
CREATE POLICY "offers_manage_own" ON event_sponsor_offers
  FOR ALL USING (sponsor_id IN (
    SELECT id FROM event_sponsors WHERE party_id = auth.uid() OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

-- event_offer_claims
ALTER TABLE event_offer_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "claims_select_own" ON event_offer_claims
  FOR SELECT USING (
    attendee_id IN (SELECT id FROM event_attendees WHERE user_id = auth.uid())
    OR offer_id IN (SELECT id FROM event_sponsor_offers WHERE sponsor_id IN (
      SELECT id FROM event_sponsors WHERE party_id = auth.uid()
    ))
  );
CREATE POLICY "claims_insert_own" ON event_offer_claims
  FOR INSERT WITH CHECK (
    attendee_id IN (SELECT id FROM event_attendees WHERE user_id = auth.uid())
  );

-- event_meetings
ALTER TABLE event_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meetings_select_own" ON event_meetings
  FOR SELECT USING (
    attendee_id IN (SELECT id FROM event_attendees WHERE user_id = auth.uid())
    OR sponsor_id IN (SELECT id FROM event_sponsors WHERE party_id = auth.uid())
  );

-- event_gamification
ALTER TABLE event_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gamification_select_all" ON event_gamification
  FOR SELECT USING (true); -- ranking e publico
CREATE POLICY "gamification_manage_own" ON event_gamification
  FOR INSERT WITH CHECK (
    attendee_id IN (SELECT id FROM event_attendees WHERE user_id = auth.uid())
  );
CREATE POLICY "gamification_update_own" ON event_gamification
  FOR UPDATE USING (
    attendee_id IN (SELECT id FROM event_attendees WHERE user_id = auth.uid())
  );

-- event_approved_attendees
ALTER TABLE event_approved_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved_select_own_cpf" ON event_approved_attendees
  FOR SELECT USING (
    cpf IN (SELECT cpf FROM event_attendees WHERE user_id = auth.uid())
    OR auth.uid() IN (SELECT user_id FROM event_attendees WHERE ticket_type IN ('admin', 'organizer'))
  );
```

**Arquivos afetados:** Nenhum (migracao SQL no Supabase)

---

### 1.2 Proteger rotas admin e sponsor no middleware

**Problema:** Qualquer usuario autenticado acessa /admin e /sponsor-portal.

**Arquivo:** `src/middleware.ts`

**Acao:**
- Adicionar `/sponsor-portal` ao `protectedPaths`
- Para `/admin`: verificar `ticket_type` via query na tabela `event_attendees`
- Usar Supabase server client no middleware para verificacao server-side

```typescript
// Verificacao de role para admin
if (request.nextUrl.pathname.startsWith('/admin')) {
  const { data: attendee } = await supabase
    .from('event_attendees')
    .select('ticket_type')
    .eq('user_id', user.id)
    .single();

  if (!attendee || !['admin', 'organizer'].includes(attendee.ticket_type)) {
    return NextResponse.redirect(new URL('/evento', request.url));
  }
}
```

---

### 1.3 Sanitizar TODOS os inputs antes de insert/update

**Problema:** Admin sessoes, chat privado, e outros locais nao sanitizam dados.

**Arquivos a corrigir:**
- `src/app/admin/sessoes/page.tsx` — Aplicar `sanitizeText()` em title, description, speaker_name, location
- `src/components/networking/ChatWindow.tsx` — Aplicar `sanitizeText()` no content antes do insert
- `src/app/admin/participantes/page.tsx` — Usar `sanitizeCSVValue()` no export CSV

---

### 1.4 Corrigir injecao de filtro PostgREST

**Problema:** Template literals em `.or()` permitem manipulacao de filtro.

**Arquivo:** `src/components/networking/ChatWindow.tsx`

**Acao:** Validar que IDs sao UUIDs validos antes de interpolar:

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!UUID_REGEX.test(currentUserId) || !UUID_REGEX.test(otherUserId)) {
  return; // Abort if invalid
}
```

Aplicar a mesma validacao em `sponsor-portal/page.tsx` na query `.or()` com email.

---

### 1.5 Restringir colunas no select (remover select('*'))

**Problema:** PII (CPF, email, telefone) exposto em 25+ queries.

**Arquivos a corrigir (prioridade):**
- `networking/page.tsx` — `.select('id, full_name, company, job_title, avatar_url, interests, ticket_type')`
- `networking/chat/[id]/page.tsx` — `.select('id, full_name, company, job_title, avatar_url, linkedin_url, interests')`
- `SponsorQRScanner.tsx` — `.select('id, full_name, company, job_title, email, phone, linkedin_url, interests, avatar_url, photo_url')`
- `admin/checkin/page.tsx` — Selecionar apenas campos necessarios

---

## PRIORIDADE 2 — ALTA (Seguranca + UX Critica)
**Prazo: 3-5 dias**

### 2.1 Permitir mensagens para usuarios offline (remover bloqueio)

**Problema:** Chat 1:1 desabilitado quando outro usuario offline quebra paradigma messaging.

**Acao:**
- Remover `disabled={!otherIsOnline}` do ChatWindow no chat/[id]/page.tsx
- Manter indicador visual de online/offline (informativo)
- Manter banner "offline" mas trocar texto para "pode nao ver sua mensagem imediatamente"
- No `AttendeeCard.tsx`, permitir link para chat independente do status online

---

### 2.2 Limpar cache do service worker no logout

**Arquivo:** `src/lib/auth.ts` (funcao signOut)

**Acao:** Adicionar limpeza de caches antes do redirect:

```typescript
export async function signOut() {
  const supabase = createSupabaseBrowser();
  // Limpar caches do service worker
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
  await supabase.auth.signOut();
}
```

---

### 2.3 Corrigir service worker para nao retornar 200 em erro

**Arquivo:** `public/sw.js`

**Acao:** Retornar status 503 para falhas offline:

```javascript
return new Response(JSON.stringify({ data: [], error: 'offline' }), {
  headers: { 'Content-Type': 'application/json' },
  status: 503, // Service Unavailable
});
```

---

### 2.4 Converter icones PWA de SVG para PNG

**Acao:** Gerar icones PNG 192x192 e 512x512 a partir do logo SVG e atualizar:
- `public/manifest.json` — Trocar paths para PNG
- `src/app/layout.tsx` — apple-touch-icon apontar para PNG

---

### 2.5 Habilitar zoom (acessibilidade WCAG)

**Arquivo:** `src/app/layout.tsx`

```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,  // Era 1
  // Remover userScalable: false
  themeColor: '#0f172a',
};
```

---

### 2.6 Adicionar aria-labels em botoes icon-only

**Arquivos:**
- `ChatWindow.tsx` — `<button aria-label="Enviar mensagem">`
- `GroupChat.tsx` — `<button aria-label="Enviar mensagem">`
- Botoes "Voltar" — `<button aria-label="Voltar">`
- `AgendaCard.tsx` — `<button aria-label="Favoritar sessao">`
- `Navbar.tsx` — Adicionar `aria-current="page"` no link ativo

---

### 2.7 Adicionar feedback de erro em queries

**Padrao a implementar em TODAS as paginas:**

```typescript
supabase.from('tabela').select('...').then(({ data, error }) => {
  if (error) {
    setErrorMsg('Erro ao carregar dados. Tente novamente.');
    console.error(error);
    return;
  }
  if (data) setData(data);
});
```

**Paginas afetadas (10+):**
evento/page.tsx, agenda/page.tsx, networking/page.tsx, patrocinadores/page.tsx,
patrocinadores/[id]/page.tsx, meus-agendamentos/page.tsx, ranking/page.tsx,
PointsBar.tsx, ContactExchange.tsx, SponsorOffer.tsx

---

### 2.8 Corrigir pagina do palestrante

**Arquivo:** `palestrantes/[id]/page.tsx`

**Acao:** Substituir `router.back()` por redirect para `/evento/palestrantes`:

```typescript
'use client';
import { redirect } from 'next/navigation';
export default function SpeakerDetailPage() {
  redirect('/evento/palestrantes');
}
```

Ou melhor: construir pagina real de perfil do palestrante.

---

## PRIORIDADE 3 — MEDIA (Melhorias Importantes)
**Prazo: 1-2 semanas**

### 3.1 Mover badge computation para RPC server-side

**Arquivo:** `src/lib/gamification.ts`

**Acao:** Criar funcao PostgreSQL `check_and_award_badges` que faz o read-check-update atomicamente.

### 3.2 Adicionar checkbox LGPD no cadastro

**Arquivo:** `src/app/completar-perfil/page.tsx`

**Acao:** Checkbox obrigatorio com texto explicito de consentimento LGPD.

### 3.3 Adicionar confirmacao para sign-out e undo check-in

**Arquivos:**
- `meu-perfil/page.tsx` — Modal de confirmacao antes de signOut
- `admin/participantes/page.tsx` — Confirmacao para desfazer check-in

### 3.4 Adicionar toasts de sucesso/erro no admin

**Arquivos:** `admin/sessoes/page.tsx`, `sponsor-portal/page.tsx`

**Acao:** Usar componente Toast existente apos operacoes CRUD.

### 3.5 Validar extensao de arquivo contra MIME type no upload

**Arquivo:** `ImageUploader.tsx`

```typescript
const MIME_TO_EXT: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};
const ext = file.name.split('.').pop()?.toLowerCase() || '';
const allowedExts = MIME_TO_EXT[file.type] || [];
const safeExt = allowedExts.includes(ext) ? ext : allowedExts[0] || 'jpg';
```

### 3.6 Scoping por event_id em todas operacoes admin

**Arquivos:**
- `admin/sessoes/page.tsx` — Delete: `.eq('id', id).eq('event_id', event.id)`
- `admin/checkin/page.tsx` — Update: adicionar `.eq('event_id', event.id)`

### 3.7 Restringir dados de contato do patrocinador para usuarios autenticados

**SQL:**
```sql
DROP POLICY "sponsors_select_all" ON event_sponsors;
-- Publico ve dados basicos, autenticado ve tudo
CREATE POLICY "sponsors_select_public" ON event_sponsors
  FOR SELECT TO anon USING (true); -- Mas criar view que exclui contact_*
CREATE POLICY "sponsors_select_auth" ON event_sponsors
  FOR SELECT TO authenticated USING (true);
```

Ou melhor: Substituir `select('*')` por selecao explicita de colunas na pagina publica.

---

## PRIORIDADE 4 — BAIXA (Otimizacoes)
**Prazo: 2-4 semanas**

### 4.1 Performance

- **Virtualizar listas longas** — Usar `@tanstack/react-virtual` em networking people, admin participantes, chat messages
- **Memoizar Supabase client** — Usar `useMemo(() => createSupabaseBrowser(), [])` em ChatWindow e outros
- **Extrair useEvent para Context** — Evitar fetch duplicado do evento em cada componente
- **Corrigir activeDay no deps da Agenda** — Remover do array de dependencias do useEffect
- **Usar next/font para Montserrat/Poppins** — Remover @import CSS, remover Inter nao usado

### 4.2 UX/Usabilidade

- **Adicionar "Meu Perfil" na navegacao bottom** — QR Badge precisa ser facilmente acessivel
- **Palestrantes com link para perfil** — Nao para sessao individual
- **Indicador global de offline** — Banner quando `navigator.onLine === false`
- **Refactor sponsor-portal em sub-componentes** — Arquivo de ~800 linhas
- **Error boundaries por segmento** — `/evento`, `/admin`, `/sponsor-portal` com error.tsx proprio

### 4.3 Seguranca Defensiva

- **Rate limiting** — Implementar debounce no envio de mensagens e acoes de gamificacao
- **useRealtime com useRef para callback** — Prevenir re-subscription loop
- **Badge codes com crypto.getRandomValues()** — Substituir Math.random()
- **noreferrer em todos links externos** — Padronizar rel="noopener noreferrer"

---

## CRONOGRAMA SUGERIDO

```
Semana 1 (Dias 1-2): PRIORIDADE 1 — Emergencial
├── 1.1 Migracao RLS (2h)
├── 1.2 Middleware admin/sponsor (1h)
├── 1.3 Sanitizacao inputs (1h)
├── 1.4 Validacao UUID no .or() (30min)
└── 1.5 Restringir select('*') (2h)

Semana 1 (Dias 3-5): PRIORIDADE 2 — Alta
├── 2.1 Chat offline permitido (1h)
├── 2.2 Limpar cache no logout (30min)
├── 2.3 Service worker 503 (30min)
├── 2.4 Icones PWA PNG (1h)
├── 2.5 Habilitar zoom (5min)
├── 2.6 Aria-labels (1h)
├── 2.7 Error handling queries (2h)
└── 2.8 Pagina palestrante (30min)

Semana 2: PRIORIDADE 3 — Media
├── 3.1 Badges server-side (2h)
├── 3.2 Checkbox LGPD (30min)
├── 3.3 Confirmacoes (1h)
├── 3.4 Toasts admin (1h)
├── 3.5 Validacao upload (30min)
├── 3.6 Event scoping admin (30min)
└── 3.7 Restringir dados sponsor (1h)

Semanas 3-4: PRIORIDADE 4 — Otimizacoes
├── Performance (4h)
├── UX/Usabilidade (4h)
└── Seguranca defensiva (2h)
```

**Estimativa total: ~25-30 horas de trabalho**

---

## METRICAS DE SUCESSO

Apos implementacao completa:
- [ ] 0 tabelas sem RLS
- [ ] 0 queries com select('*') em dados de PII
- [ ] 0 inputs nao-sanitizados antes de insert/update
- [ ] 100% das rotas protegidas verificam role server-side
- [ ] Cache limpo no logout
- [ ] WCAG 2.1 AA em contraste e zoom
- [ ] Feedback visual em 100% das operacoes async
- [ ] Build sem erros + deploy com sucesso
