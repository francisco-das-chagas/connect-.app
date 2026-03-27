import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  isSessionLive,
  isSessionPast,
  isSessionUpcoming,
  getCountdown,
  getWhatsAppUrl,
  getShortName,
  cn,
  getInitials,
  groupSessionsByDay,
} from '@/lib/utils';

describe('formatTime', () => {
  it('formats ISO string to HH:mm', () => {
    expect(formatTime('2025-06-15T14:30:00Z')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formats midnight correctly', () => {
    // Use a timezone-neutral approach: just check it produces valid HH:mm
    const result = formatTime('2025-06-15T00:00:00Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('formatDate', () => {
  it('formats date in pt-BR locale with "de" month format', () => {
    const result = formatDate('2025-06-15T14:30:00Z');
    // Should contain "de" and a Portuguese month name
    expect(result).toContain('de');
    // Should contain the day number
    expect(result).toMatch(/\d{2}/);
  });

  it('formats January date', () => {
    const result = formatDate('2025-01-05T10:00:00Z');
    expect(result).toContain('de');
    expect(result.toLowerCase()).toContain('janeiro');
  });
});

describe('formatDateTime', () => {
  it('returns date and time with "as" separator', () => {
    const result = formatDateTime('2025-06-15T14:30:00Z');
    expect(result).toContain('as');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('isSessionLive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when now is between start and end', () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00Z'));
    expect(isSessionLive('2025-06-15T13:00:00Z', '2025-06-15T15:00:00Z')).toBe(true);
  });

  it('returns false when now is before start', () => {
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    expect(isSessionLive('2025-06-15T13:00:00Z', '2025-06-15T15:00:00Z')).toBe(false);
  });

  it('returns false when now is after end', () => {
    vi.setSystemTime(new Date('2025-06-15T16:00:00Z'));
    expect(isSessionLive('2025-06-15T13:00:00Z', '2025-06-15T15:00:00Z')).toBe(false);
  });

  it('returns false when now equals start exactly (isAfter is exclusive)', () => {
    vi.setSystemTime(new Date('2025-06-15T13:00:00Z'));
    expect(isSessionLive('2025-06-15T13:00:00Z', '2025-06-15T15:00:00Z')).toBe(false);
  });

  it('returns false when now equals end exactly (isBefore is exclusive)', () => {
    vi.setSystemTime(new Date('2025-06-15T15:00:00Z'));
    expect(isSessionLive('2025-06-15T13:00:00Z', '2025-06-15T15:00:00Z')).toBe(false);
  });
});

describe('isSessionPast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when now is after end time', () => {
    vi.setSystemTime(new Date('2025-06-15T16:00:00Z'));
    expect(isSessionPast('2025-06-15T15:00:00Z')).toBe(true);
  });

  it('returns false when now is before end time', () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00Z'));
    expect(isSessionPast('2025-06-15T15:00:00Z')).toBe(false);
  });
});

describe('isSessionUpcoming', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when now is before start time', () => {
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    expect(isSessionUpcoming('2025-06-15T13:00:00Z')).toBe(true);
  });

  it('returns false when now is after start time', () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00Z'));
    expect(isSessionUpcoming('2025-06-15T13:00:00Z')).toBe(false);
  });
});

describe('getCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zeros when target is in the past', () => {
    vi.setSystemTime(new Date('2025-06-15T16:00:00Z'));
    const result = getCountdown('2025-06-15T15:00:00Z');
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('calculates correct countdown for 1 day, 2 hours, 30 minutes, 15 seconds', () => {
    vi.setSystemTime(new Date('2025-06-15T10:00:00Z'));
    // Target: 1 day, 2 hours, 30 minutes, 15 seconds ahead
    const result = getCountdown('2025-06-16T12:30:15Z');
    expect(result.days).toBe(1);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(30);
    expect(result.seconds).toBe(15);
  });

  it('calculates countdown for exactly 1 hour', () => {
    vi.setSystemTime(new Date('2025-06-15T14:00:00Z'));
    const result = getCountdown('2025-06-15T15:00:00Z');
    expect(result).toEqual({ days: 0, hours: 1, minutes: 0, seconds: 0 });
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', false, 'bar', undefined, null, '')).toBe('foo bar');
  });

  it('returns empty string when all values are falsy', () => {
    expect(cn(false, undefined, null)).toBe('');
  });

  it('handles single class', () => {
    expect(cn('single')).toBe('single');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });
});

describe('getWhatsAppUrl', () => {
  it('generates URL with Brazilian country code for digits-only phone', () => {
    expect(getWhatsAppUrl('11987654321')).toBe('https://wa.me/5511987654321');
  });

  it('does not double-add country code if already present', () => {
    expect(getWhatsAppUrl('5511987654321')).toBe('https://wa.me/5511987654321');
  });

  it('strips non-digits from phone', () => {
    expect(getWhatsAppUrl('(11) 98765-4321')).toBe('https://wa.me/5511987654321');
  });

  it('appends encoded message when provided', () => {
    const url = getWhatsAppUrl('11987654321', 'Hello World');
    expect(url).toBe('https://wa.me/5511987654321?text=Hello%20World');
  });

  it('returns URL without message param when message is undefined', () => {
    const url = getWhatsAppUrl('11987654321');
    expect(url).not.toContain('?text=');
  });
});

describe('getShortName', () => {
  it('returns first and last name from full name', () => {
    expect(getShortName('John Michael Smith')).toBe('John Smith');
  });

  it('returns single name unchanged', () => {
    expect(getShortName('John')).toBe('John');
  });

  it('returns first and last for two-word name', () => {
    expect(getShortName('John Smith')).toBe('John Smith');
  });

  it('handles extra whitespace', () => {
    expect(getShortName('  John   Michael   Smith  ')).toBe('John Smith');
  });

  it('handles empty string', () => {
    expect(getShortName('')).toBe('');
  });
});

describe('getInitials', () => {
  it('returns first two initials uppercased', () => {
    expect(getInitials('John Smith')).toBe('JS');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to two initials for long names', () => {
    expect(getInitials('John Michael Edward Smith')).toBe('JM');
  });

  it('uppercases lowercase initials', () => {
    expect(getInitials('john smith')).toBe('JS');
  });
});

describe('groupSessionsByDay', () => {
  it('groups sessions by date (yyyy-MM-dd)', () => {
    const sessions = [
      { start_time: '2025-06-15T10:00:00Z', title: 'A' },
      { start_time: '2025-06-15T14:00:00Z', title: 'B' },
      { start_time: '2025-06-16T10:00:00Z', title: 'C' },
    ];
    const grouped = groupSessionsByDay(sessions);
    const keys = Object.keys(grouped);
    // Should have two different days
    expect(keys.length).toBe(2);
    // Each key should be a yyyy-MM-dd formatted string
    keys.forEach((key) => {
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('returns empty object for empty array', () => {
    expect(groupSessionsByDay([])).toEqual({});
  });

  it('preserves session data in groups', () => {
    const sessions = [
      { start_time: '2025-06-15T10:00:00Z', title: 'Session A' },
    ];
    const grouped = groupSessionsByDay(sessions);
    const values = Object.values(grouped);
    expect(values[0]).toHaveLength(1);
    expect(values[0][0].title).toBe('Session A');
  });
});
