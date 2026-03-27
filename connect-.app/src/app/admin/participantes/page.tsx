'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { useEvent } from '@/hooks/useEvent';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { formatDateTime, getInitials } from '@/lib/utils';
import { sanitizeCSVValue } from '@/lib/sanitize';
import type { EventAttendee } from '@/types';

type SortField = 'full_name' | 'company' | 'created_at' | 'checked_in_at';
type SortDir = 'asc' | 'desc';

export default function AdminParticipantesPage() {
  const { event } = useEvent();
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [filtered, setFiltered] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState<'all' | 'yes' | 'no'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();

    supabase
      .from('event_attendees')
      .select('id, event_id, user_id, full_name, email, phone, company, job_title, avatar_url, badge_code, ticket_type, checked_in_at, networking_visible, interests, status, created_at')
      .eq('event_id', event.id)
      .order(sortField, { ascending: sortDir === 'asc' })
      .then(({ data, error }) => {
        if (error) console.error('Error loading attendees:', error);
        if (data) {
          setAttendees(data as EventAttendee[]);
          setFiltered(data as EventAttendee[]);
        }
        setLoading(false);
      });
  }, [event, sortField, sortDir]);

  // Filters
  useEffect(() => {
    let result = attendees;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.company?.toLowerCase().includes(q) ||
          a.badge_code?.toLowerCase().includes(q)
      );
    }

    if (filterType) {
      result = result.filter((a) => a.ticket_type === filterType);
    }

    if (filterCheckedIn === 'yes') {
      result = result.filter((a) => a.checked_in_at);
    } else if (filterCheckedIn === 'no') {
      result = result.filter((a) => !a.checked_in_at);
    }

    setFiltered(result);
  }, [search, filterType, filterCheckedIn, attendees]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded transition-colors ${
        sortField === field ? 'text-accent-500' : 'text-silver/50 hover:text-silver/80'
      }`}
    >
      {label} {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </button>
  );

  const handleCheckIn = async (attendee: EventAttendee) => {
    // Confirm undo check-in (destructive action)
    if (attendee.checked_in_at) {
      if (!window.confirm(`Desfazer check-in de ${attendee.full_name}?`)) return;
    }

    const supabase = createSupabaseBrowser();
    const now = new Date().toISOString();

    await supabase
      .from('event_attendees')
      .update({ checked_in_at: attendee.checked_in_at ? null : now })
      .eq('id', attendee.id)
      .eq('event_id', event!.id);

    setAttendees((prev) =>
      prev.map((a) =>
        a.id === attendee.id
          ? { ...a, checked_in_at: attendee.checked_in_at ? null : now }
          : a
      )
    );
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Empresa', 'Cargo', 'Email', 'Telefone', 'Tipo', 'Badge', 'Check-in'];
    const rows = filtered.map((a) => [
      a.full_name,
      a.company || '',
      a.job_title || '',
      a.email || '',
      a.phone || '',
      a.ticket_type || '',
      a.badge_code || '',
      a.checked_in_at ? formatDateTime(a.checked_in_at) : 'Nao',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => sanitizeCSVValue(cell)).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes-${event?.slug || 'evento'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <PageLoading />;

  const checkedInCount = attendees.filter((a) => a.checked_in_at).length;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Participantes</h1>
          <p className="text-xs text-silver/50 mt-0.5">
            {attendees.length} inscritos • {checkedInCount} check-ins
          </p>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary text-xs">
          Exportar CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, empresa, badge..."
          className="input pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-silver/60"
        >
          <option value="">Todos os tipos</option>
          <option value="standard">Standard</option>
          <option value="vip">VIP</option>
          <option value="speaker">Palestrante</option>
          <option value="sponsor">Patrocinador</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={filterCheckedIn}
          onChange={(e) => setFilterCheckedIn(e.target.value as 'all' | 'yes' | 'no')}
          className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-silver/60"
        >
          <option value="all">Check-in: Todos</option>
          <option value="yes">Com check-in</option>
          <option value="no">Sem check-in</option>
        </select>
      </div>

      <p className="text-xs text-silver/60 mb-3">{filtered.length} resultado(s)</p>

      {/* Sort Headers */}
      <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] text-silver/40 mr-1">Ordenar:</span>
        <SortHeader field="full_name" label="Nome" />
        <SortHeader field="company" label="Empresa" />
        <SortHeader field="created_at" label="Inscricao" />
        <SortHeader field="checked_in_at" label="Check-in" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
          >
            {a.avatar_url ? (
              <img src={a.avatar_url} alt={a.full_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-accent-500">{getInitials(a.full_name)}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-white truncate">{a.full_name}</h3>
              <p className="text-xs text-silver/50 truncate">
                {a.company || ''} {a.badge_code ? `• ${a.badge_code}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {a.ticket_type && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-silver/50 font-medium">
                  {a.ticket_type}
                </span>
              )}
              <button
                onClick={() => handleCheckIn(a)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  a.checked_in_at
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-white/20 text-white/20 hover:border-green-400 hover:text-green-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
