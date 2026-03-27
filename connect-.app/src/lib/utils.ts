import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: string) {
  return format(parseISO(date), "dd 'de' MMMM", { locale: ptBR });
}

export function formatTime(date: string) {
  return format(parseISO(date), 'HH:mm', { locale: ptBR });
}

export function formatDateTime(date: string) {
  return format(parseISO(date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function formatRelative(date: string) {
  return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: ptBR });
}

export function isSessionLive(startTime: string, endTime: string) {
  const now = new Date();
  return isAfter(now, parseISO(startTime)) && isBefore(now, parseISO(endTime));
}

export function isSessionPast(endTime: string) {
  return isAfter(new Date(), parseISO(endTime));
}

export function isSessionUpcoming(startTime: string) {
  return isBefore(new Date(), parseISO(startTime));
}

export function getCountdown(targetDate: string) {
  const target = parseISO(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  const fullNumber = digits.startsWith('55') ? digits : `55${digits}`;
  const url = `https://wa.me/${fullNumber}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export function getShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function groupSessionsByDay<T extends { start_time: string }>(sessions: T[]) {
  const grouped: Record<string, T[]> = {};
  sessions.forEach((session) => {
    const day = format(parseISO(session.start_time), 'yyyy-MM-dd');
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(session);
  });
  return grouped;
}
