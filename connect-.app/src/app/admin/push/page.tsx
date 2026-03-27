'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';
import { sanitizeText, MAX_LENGTHS } from '@/lib/sanitize';
import type { EventNotification } from '@/types';

export default function AdminPushPage() {
  const { event } = useEvent();
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'general' as string,
    target_audience: 'all' as string,
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!event) return;
    loadNotifications();
  }, [event]);

  const loadNotifications = async () => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    const { data } = await supabase
      .from('event_notifications')
      .select('id, event_id, title, body, type, target_audience, sent_at, created_at')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setNotifications(data as EventNotification[]);
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !form.title.trim()) return;
    setSending(true);

    try {
      const supabase = createSupabaseBrowser();

      // Sanitize notification inputs
      const validTypes = ['general', 'session', 'sponsor', 'networking', 'alert'];
      const validAudiences = ['all', 'vip', 'speakers', 'sponsors'];

      await supabase.from('event_notifications').insert({
        event_id: event.id,
        title: sanitizeText(form.title, MAX_LENGTHS.shortText),
        body: form.body ? sanitizeText(form.body, MAX_LENGTHS.mediumText) : null,
        type: validTypes.includes(form.type) ? form.type : 'general',
        target_audience: validAudiences.includes(form.target_audience) ? form.target_audience : 'all',
        sent_at: new Date().toISOString(),
      });

      setForm({ title: '', body: '', type: 'general', target_audience: 'all' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadNotifications();
    } catch (err) {
      console.error('Send notification error:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoading />;

  const typeIcons: Record<string, string> = {
    general: '📢',
    session: '📅',
    sponsor: '🏢',
    networking: '🤝',
    alert: '🚨',
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-6">Notificacoes</h1>

      {/* Send Form */}
      <form onSubmit={handleSend} className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-white">Enviar Notificacao</h2>

        <div>
          <label className="block text-xs font-medium text-silver/60 mb-1">Titulo *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="Ex: Proxima sessao comeca em 10 min"
            required
            maxLength={MAX_LENGTHS.shortText}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-silver/60 mb-1">Mensagem</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="input min-h-[80px] resize-none"
            placeholder="Detalhes adicionais..."
            maxLength={MAX_LENGTHS.mediumText}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input"
            >
              <option value="general">Geral</option>
              <option value="session">Sessao</option>
              <option value="sponsor">Patrocinador</option>
              <option value="networking">Networking</option>
              <option value="alert">Alerta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">Publico</label>
            <select
              value={form.target_audience}
              onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
              className="input"
            >
              <option value="all">Todos</option>
              <option value="vip">VIP</option>
              <option value="speakers">Palestrantes</option>
              <option value="sponsors">Patrocinadores</option>
            </select>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/20 p-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Notificacao enviada!
          </div>
        )}

        <button type="submit" disabled={sending || !form.title.trim()} className="btn-primary w-full">
          {sending ? 'Enviando...' : 'Enviar Notificacao'}
        </button>
      </form>

      {/* History */}
      <h2 className="text-sm font-semibold text-white mb-3">Historico ({notifications.length})</h2>
      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{typeIcons[notif.type] || '📢'}</span>
              <h3 className="font-semibold text-sm text-white flex-1">{notif.title}</h3>
              <span className="text-[10px] text-silver/60">
                {notif.target_audience || 'todos'}
              </span>
            </div>
            {notif.body && (
              <p className="text-xs text-silver/50 mb-1">{notif.body}</p>
            )}
            <p className="text-[10px] text-silver/30">
              {notif.sent_at ? formatDateTime(notif.sent_at) : 'Nao enviada'}
            </p>
          </div>
        ))}

        {notifications.length === 0 && (
          <p className="text-sm text-silver/60 text-center py-4">
            Nenhuma notificacao enviada
          </p>
        )}
      </div>
    </div>
  );
}
