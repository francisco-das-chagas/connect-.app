'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { formatTime } from '@/lib/utils';
import { sanitizeText, MAX_LENGTHS } from '@/lib/sanitize';
import type { EventMessage } from '@/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
  eventId: string;
  disabled?: boolean;
}

export function ChatWindow({ currentUserId, otherUserId, eventId, disabled = false }: ChatWindowProps) {
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  useEffect(() => {
    // Validate UUIDs before interpolating into filter to prevent PostgREST injection
    if (!UUID_REGEX.test(currentUserId) || !UUID_REGEX.test(otherUserId) || !UUID_REGEX.test(eventId)) {
      return;
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from('event_messages')
        .select('id, event_id, sender_id, receiver_id, content, created_at, read_at')
        .eq('event_id', eventId)
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true });

      if (data) setMessages(data as EventMessage[]);
    };

    loadMessages();
  }, [currentUserId, otherUserId, eventId]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${currentUserId}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `event_id=eq.${eventId}` },
        (payload) => {
          const msg = payload.new as EventMessage;
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, otherUserId, eventId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const unread = messages.filter((m) => m.receiver_id === currentUserId && !m.read_at);
    if (unread.length > 0) {
      supabase
        .from('event_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unread.map((m) => m.id))
        .then(() => {});
    }
  }, [messages, currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || disabled) return;
    setSending(true);

    const sanitizedContent = sanitizeText(newMessage.trim(), MAX_LENGTHS.shortText);
    if (!sanitizedContent) { setSending(false); return; }

    const { error } = await supabase.from('event_messages').insert({
      event_id: eventId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: sanitizedContent,
    });

    if (!error) { setNewMessage(''); }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-navy">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-silver/60">Nenhuma mensagem ainda</p>
            <p className="text-xs text-silver/30 mt-1">Diga ola!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isMine
                    ? 'bg-accent-500 text-navy-dark rounded-br-md'
                    : 'bg-white/10 text-white rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-navy/50' : 'text-silver/60'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-navy-light"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={disabled ? 'Usuario offline...' : 'Digite sua mensagem...'}
          className={`flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/30 placeholder:text-white/30 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          maxLength={500}
          disabled={disabled}
        />
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!newMessage.trim() || sending || disabled}
          className={`w-10 h-10 rounded-full bg-accent-500 text-navy-dark flex items-center justify-center hover:bg-accent-400 transition-colors disabled:opacity-50 ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
