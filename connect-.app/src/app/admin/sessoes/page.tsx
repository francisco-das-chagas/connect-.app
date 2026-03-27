'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { formatDate, formatTime } from '@/lib/utils';
import { sanitizeText, sanitizeUrl, MAX_LENGTHS } from '@/lib/sanitize';
import { SESSION_TYPE_LABELS } from '@/types';
import type { EventSession } from '@/types';
import { Toast } from '@/components/shared/Toast';

export default function AdminSessoesPage() {
  const { event } = useEvent();
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    speaker_name: '',
    speaker_title: '',
    speaker_bio: '',
    speaker_photo_url: '',
    start_time: '',
    end_time: '',
    room: '',
    track: '',
    session_type: 'talk' as string,
    sort_order: 0,
  });

  useEffect(() => {
    loadSessions();
  }, [event]);

  const loadSessions = async () => {
    if (!event) return;
    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase
      .from('event_sessions')
      .select('id, event_id, title, description, speaker_name, speaker_title, speaker_photo_url, speaker_bio, start_time, end_time, room, track, session_type, sort_order, created_at')
      .eq('event_id', event.id)
      .order('start_time', { ascending: true });

    if (error) console.error('Error loading sessions:', error);
    if (data) setSessions(data as EventSession[]);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      speaker_name: '',
      speaker_title: '',
      speaker_bio: '',
      speaker_photo_url: '',
      start_time: '',
      end_time: '',
      room: '',
      track: '',
      session_type: 'talk',
      sort_order: 0,
    });
    setEditingSession(null);
  };

  const openEdit = (session: EventSession) => {
    setForm({
      title: session.title,
      description: session.description || '',
      speaker_name: session.speaker_name || '',
      speaker_title: session.speaker_title || '',
      speaker_bio: session.speaker_bio || '',
      speaker_photo_url: session.speaker_photo_url || '',
      start_time: session.start_time ? session.start_time.slice(0, 16) : '',
      end_time: session.end_time ? session.end_time.slice(0, 16) : '',
      room: session.room || '',
      track: session.track || '',
      session_type: session.session_type || 'talk',
      sort_order: session.sort_order || 0,
    });
    setEditingSession(session);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSaving(true);

    const supabase = createSupabaseBrowser();
    const payload = {
      event_id: event.id,
      title: sanitizeText(form.title, MAX_LENGTHS.shortText),
      description: form.description ? sanitizeText(form.description, MAX_LENGTHS.longText) : null,
      speaker_name: form.speaker_name ? sanitizeText(form.speaker_name, MAX_LENGTHS.name) : null,
      speaker_title: form.speaker_title ? sanitizeText(form.speaker_title, MAX_LENGTHS.jobTitle) : null,
      speaker_bio: form.speaker_bio ? sanitizeText(form.speaker_bio, MAX_LENGTHS.longText) : null,
      speaker_photo_url: form.speaker_photo_url ? sanitizeUrl(form.speaker_photo_url) : null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      room: form.room ? sanitizeText(form.room, MAX_LENGTHS.shortText) : null,
      track: form.track ? sanitizeText(form.track, MAX_LENGTHS.shortText) : null,
      session_type: form.session_type,
      sort_order: form.sort_order,
    };

    let error;
    if (editingSession) {
      ({ error } = await supabase
        .from('event_sessions')
        .update(payload)
        .eq('id', editingSession.id));
    } else {
      ({ error } = await supabase.from('event_sessions').insert(payload));
    }

    if (error) {
      console.error('Session save error:', error);
      setToast({ message: 'Erro ao salvar sessao.', type: 'error' });
    } else {
      setToast({ message: editingSession ? 'Sessao atualizada!' : 'Sessao criada!', type: 'success' });
      resetForm();
      setShowForm(false);
    }

    setSaving(false);
    await loadSessions();
  };

  const handleDelete = async (id: string) => {
    if (!event) return;
    if (!confirm('Tem certeza que deseja excluir esta sessao?')) return;
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.from('event_sessions').delete().eq('id', id).eq('event_id', event.id);
    if (error) {
      setToast({ message: 'Erro ao excluir sessao.', type: 'error' });
    } else {
      setToast({ message: 'Sessao excluida!', type: 'success' });
    }
    await loadSessions();
  };

  if (loading) return <PageLoading />;

  return (
    <div className="px-4 py-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Sessoes ({sessions.length})</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-primary text-sm"
        >
          {showForm ? 'Cancelar' : '+ Nova Sessao'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6 space-y-3">
          <h2 className="font-semibold text-white">
            {editingSession ? 'Editar Sessao' : 'Nova Sessao'}
          </h2>

          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">Titulo *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-silver/60 mb-1">Inicio</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-silver/60 mb-1">Fim</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-silver/60 mb-1">Tipo</label>
              <select
                value={form.session_type}
                onChange={(e) => setForm({ ...form, session_type: e.target.value })}
                className="input"
              >
                {Object.entries(SESSION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-silver/60 mb-1">Sala</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">Trilha</label>
            <input
              type="text"
              value={form.track}
              onChange={(e) => setForm({ ...form, track: e.target.value })}
              className="input"
              placeholder="Ex: Tributario, Tech, Gestao"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[80px] resize-none"
            />
          </div>

          <hr className="border-white/10" />
          <h3 className="text-xs font-semibold text-silver/60 uppercase">Palestrante</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-silver/60 mb-1">Nome</label>
              <input
                type="text"
                value={form.speaker_name}
                onChange={(e) => setForm({ ...form, speaker_name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-silver/60 mb-1">Titulo/Cargo</label>
              <input
                type="text"
                value={form.speaker_title}
                onChange={(e) => setForm({ ...form, speaker_title: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">URL Foto</label>
            <input
              type="url"
              value={form.speaker_photo_url}
              onChange={(e) => setForm({ ...form, speaker_photo_url: e.target.value })}
              className="input"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">Bio</label>
            <textarea
              value={form.speaker_bio}
              onChange={(e) => setForm({ ...form, speaker_bio: e.target.value })}
              className="input min-h-[60px] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-silver/60 mb-1">Ordem</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="input w-24"
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Salvando...' : editingSession ? 'Atualizar' : 'Criar Sessao'}
          </button>
        </form>
      )}

      {/* Sessions List */}
      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-white truncate">{session.title}</h3>
              <p className="text-xs text-silver/50">
                {session.start_time ? formatDate(session.start_time) : ''}{' '}
                {session.start_time ? formatTime(session.start_time) : ''} - {session.end_time ? formatTime(session.end_time) : ''}
                {session.room ? ` • ${session.room}` : ''}
              </p>
              {session.speaker_name && (
                <p className="text-xs text-silver/60 mt-0.5">{session.speaker_name}</p>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => openEdit(session)}
                className="p-2 rounded-lg hover:bg-white/10 text-silver/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(session.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
