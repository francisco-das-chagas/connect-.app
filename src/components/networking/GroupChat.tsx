'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { formatTime, getShortName } from '@/lib/utils';
import { sanitizeText, MAX_LENGTHS } from '@/lib/sanitize';
import type { EventGroupMessage } from '@/types';

interface GroupChatProps {
  eventId: string;
  senderId: string;
  senderName: string;
  senderType: 'participante' | 'patrocinador';
}

const PAGE_SIZE = 50;

export function GroupChat({ eventId, senderId, senderName, senderType }: GroupChatProps) {
  const [messages, setMessages] = useState<EventGroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  // Load initial messages
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('event_group_messages')
        .select('id, event_id, sender_id, sender_name, sender_type, content, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (data) {
        const reversed = (data as EventGroupMessage[]).reverse();
        setMessages(reversed);
        setHasMore(data.length === PAGE_SIZE);
      }
      setInitialLoad(false);
    };

    load();
  }, [eventId, supabase]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_group_messages',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const msg = payload.new as EventGroupMessage;
          setMessages((prev) => {
            // Dedup: don't add if already exists (from optimistic update)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!initialLoad) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, initialLoad]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!initialLoad && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [initialLoad]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldestMessage = messages[0];
    const { data } = await supabase
      .from('event_group_messages')
      .select('id, event_id, sender_id, sender_name, sender_type, content, created_at')
      .eq('event_id', eventId)
      .lt('created_at', oldestMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (data) {
      const older = (data as EventGroupMessage[]).reverse();
      setMessages((prev) => [...older, ...prev]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, messages, eventId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = sanitizeText(newMessage.trim(), MAX_LENGTHS.shortText);
    if (!content || sending) return;

    setSending(true);
    setNewMessage('');

    const { error } = await supabase.from('event_group_messages').insert({
      event_id: eventId,
      sender_id: senderId,
      sender_name: getShortName(senderName),
      sender_type: senderType,
      content,
    });

    if (error) {
      console.error('Send group message error:', error);
      setNewMessage(content); // Restore on error
    }
    setSending(false);
  };

  const typeBadge = (type: string) => {
    if (type === 'patrocinador') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-wider">
          Sponsor
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Load more button */}
        {hasMore && messages.length > 0 && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full text-center text-xs text-silver/60 py-2 hover:text-silver/60 transition-colors"
          >
            {loadingMore ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-silver/30 border-t-silver rounded-full animate-spin" />
                Carregando...
              </span>
            ) : (
              'Carregar mensagens anteriores'
            )}
          </button>
        )}

        {initialLoad ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-silver/30 border-t-accent-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm text-silver/60">Nenhuma mensagem no grupo</p>
            <p className="text-xs text-silver/30 mt-1">Seja o primeiro a dizer ola!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === senderId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] ${
                    isMine
                      ? 'bg-accent-500 rounded-2xl rounded-br-md'
                      : 'bg-white/10 rounded-2xl rounded-bl-md'
                  }`}
                >
                  {/* Sender info (only for other people) */}
                  {!isMine && (
                    <div className="flex items-center gap-1.5 px-4 pt-2">
                      <span className="text-xs font-semibold text-accent-400">
                        {msg.sender_name}
                      </span>
                      {typeBadge(msg.sender_type)}
                    </div>
                  )}
                  <div className="px-4 py-1.5 pb-2">
                    <p className={`text-sm leading-relaxed ${isMine ? 'text-navy-dark' : 'text-white'}`}>
                      {msg.content}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isMine ? 'text-navy/50' : 'text-silver/60'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-navy-light"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mensagem para o grupo..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/30 placeholder:text-white/30"
          maxLength={MAX_LENGTHS.shortText}
        />
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!newMessage.trim() || sending}
          className="w-10 h-10 rounded-full bg-accent-500 text-navy-dark flex items-center justify-center hover:bg-accent-400 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
