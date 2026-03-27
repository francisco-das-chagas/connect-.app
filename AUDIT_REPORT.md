# AUDITORIA COMPLETA — Connect Valley 2026

**Data:** 2026-03-07
**Escopo:** Seguranca, UX/UI, Usabilidade, Funcionalidades, Acessibilidade, Performance, PWA
**Stack:** Next.js 14 + Supabase + Tailwind CSS
**Arquivos analisados:** 60+

---

## RESUMO EXECUTIVO

| Categoria | Critico | Alto | Medio | Baixo |
|-----------|---------|------|-------|-------|
| Seguranca | 5 | 6 | 7 | 5 |
| UX/UI | 2 | 4 | 2 | 2 |
| Usabilidade | 0 | 4 | 0 | 2 |
| Funcionalidade | 1 | 5 | 0 | 2 |
| Acessibilidade | 1 | 2 | 0 | 2 |
| PWA/Mobile | 0 | 3 | 0 | 2 |
| Performance | 0 | 2 | 0 | 3 |
| **TOTAL** | **9** | **26** | **9** | **18** |

---

## 1. SEGURANCA

### CRITICOS

**SEC-C1: Tabelas sem RLS (Row Level Security)**
8 tabelas acessadas pelo client-side NAO possuem politicas RLS:
- `event_group_messages` — qualquer usuario autenticado le/escreve mensagens de qualquer evento
- `event_sponsor_offers` — qualquer usuario cria/edita ofertas de qualquer patrocinador
- `event_offer_claims` — qualquer usuario ve quem resgatou ofertas
- `event_meetings` — qualquer usuario le reunioes de todos
- `event_gamification` — qualquer usuario manipula pontuacao de qualquer participante
- `event_approved_attendees` — qualquer usuario acessa lista completa de CPFs aprovados
- `parties` — sem restricao de acesso
- `deals` — sem restricao de acesso

**SEC-C2: Sem verificacao de role no middleware para rotas admin**
`middleware.ts` verifica apenas se o usuario esta autenticado, nao verifica `ticket_type`. A verificacao de admin e feita apenas client-side em `admin/layout.tsx`, facilmente bypassavel.

**SEC-C3: Rota /sponsor-portal nao protegida no middleware**
O path `/sponsor-portal` nao esta na lista `protectedPaths` do middleware. Usuarios nao autenticados podem acessar a pagina.

**SEC-C4: Injecao de filtro PostgREST via template literal no .or()**
`ChatWindow.tsx:28-30` — Valores de `currentUserId` e `otherUserId` sao interpolados diretamente na string de filtro `.or()`. O `otherUserId` vem do parametro de URL `[id]`, controlado pelo usuario.

**SEC-C5: Admin CRUD de sessoes sem sanitizacao de input**
`admin/sessoes/page.tsx` — Todos os campos do formulario sao inseridos no banco sem usar `sanitizeText()`, apesar da funcao existir em `sanitize.ts`.

### ALTOS

**SEC-H1: select('*') expoe PII (CPF, email, telefone) em 25+ locais**
Queries usando `select('*')` em `event_attendees` retornam CPF, email, telefone para qualquer usuario autenticado. Afeta: networking/page.tsx, chat/[id]/page.tsx, SponsorQRScanner.tsx, etc.

**SEC-H2: Mensagens privadas (ChatWindow) nao sanitizadas antes do insert**
`ChatWindow.tsx:80-85` — `newMessage.trim()` sem `sanitizeText()`. Contrasta com GroupChat que sanitiza corretamente.

**SEC-H3: Export CSV admin vulneravel a formula injection**
`admin/participantes/page.tsx` — Nao usa `sanitizeCSVValue()` que existe em `sanitize.ts`.

**SEC-H4: Dados de contato do patrocinador acessiveis sem autenticacao**
RLS policy `sponsors_select_all` permite `anon` ler todas as colunas de `event_sponsors`, incluindo `contact_email`, `contact_phone`.

**SEC-H5: IDOR em sponsor offers — CRUD por ID sem verificacao de ownership**
`sponsor-portal/page.tsx` — Operacoes de update/delete em `event_sponsor_offers` filtram apenas por `id`, sem verificar se o sponsor pertence ao usuario logado. Combinado com falta de RLS na tabela.

**SEC-H6: Delete de sessao nao scoped por event_id**
`admin/sessoes/page.tsx:129` — `.delete().eq('id', id)` sem filtrar por `event_id`.

### MEDIOS

**SEC-M1: Impersonacao no group chat — sender_id nao validado por RLS**
**SEC-M2: Manipulacao de gamificacao — badges atualizados client-side sem RLS**
**SEC-M3: Service worker cacheia respostas com PII sem limpeza no logout**
**SEC-M4: Upload de imagem nao valida extensao contra MIME type**
**SEC-M5: Admin checkin sem scoping por event_id**
**SEC-M6: Lista de CPFs aprovados acessivel sem RLS**
**SEC-M7: Subscricoes realtime em tabelas sem RLS entregam dados a qualquer subscriber**

### BAIXOS

**SEC-L1: Auth hook mantem sessao local em falha de rede**
**SEC-L2: Web Lock bypass no cliente Supabase**
**SEC-L3: CRM integration nao sanitiza email**
**SEC-L4: Sem rate limiting em nenhuma operacao client-side**
**SEC-L5: Math.random() para badge codes (nao criptografico)**

---

## 2. UX/UI

### CRITICOS

**UX-C1: Pagina de detalhe do palestrante chama router.back() no render**
`palestrantes/[id]/page.tsx` — Side-effect no render, anti-pattern React.

**UX-C2: Chat 1:1 desabilitado quando outro usuario offline**
Quebra paradigma de messaging assincrono. Usuarios nao conseguem enviar mensagens para quem saiu da area de networking.

### ALTOS

**UX-H1: "Meu Perfil" nao esta na navegacao bottom** — Baixa descobribilidade do QR badge.
**UX-H2: Sem dialogo de confirmacao para sign-out** — Taps acidentais em mobile.
**UX-H3: Palestrantes linkam para sessao, nao perfil do palestrante.**
**UX-H4: Sem checkbox LGPD explicita no cadastro** — Risco legal sob Lei Geral de Protecao de Dados.

---

## 3. USABILIDADE

### ALTOS

**USA-H1: Sem feedback de erro em queries Supabase** — 10+ paginas ignoram erros, usuario ve tela vazia.
**USA-H2: Admin check-in toggle sem confirmacao para undo.**
**USA-H3: Admin CRUD sessoes sem toast de sucesso/erro.**
**USA-H4: Componentes interativos logam erro no console sem feedback visual ao usuario.**

---

## 4. FUNCIONALIDADE

### CRITICO

**FUN-C1: useRealtime re-subscribe infinito se callback nao memoizado**
`useRealtime.ts` — `callback` no dependency array do useEffect causa loop de subscribe/unsubscribe.

### ALTOS

**FUN-H1: ChatWindow cria novo Supabase client a cada render.**
**FUN-H2: Agenda re-fetch ao trocar aba de dia (activeDay no deps do useEffect).**
**FUN-H3: Admin dashboard N+1 queries para sponsor engagement.**
**FUN-H4: Race condition no update de badges de gamificacao (read-then-write nao atomico).**
**FUN-H5: Toast component reseta timer se onClose nao memoizado.**

---

## 5. ACESSIBILIDADE

### CRITICO

**A11Y-C1: Pinch-to-zoom desabilitado** — `userScalable: false` viola WCAG 2.1.

### ALTOS

**A11Y-H1: Botoes icon-only sem aria-label** — Botao enviar, botoes voltar, favoritos, etc.
**A11Y-H2: Sem focus management ao trocar abas** — Tabs sem `role="tablist"` / `aria-selected`.

---

## 6. PWA/MOBILE

### ALTOS

**PWA-H1: Icones PWA em SVG (nao suportado no Android/iOS).**
**PWA-H2: Service worker cacheia dados sensiveis sem limpeza no logout.**
**PWA-H3: Service worker retorna HTTP 200 para falhas offline.**

---

## 7. PERFORMANCE

### ALTOS

**PERF-H1: Sem virtualizacao de listas longas (networking, admin, chat).**
**PERF-H2: Multiplas criacoes de Supabase client sem memoizacao.**

---
