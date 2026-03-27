import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeCSVValue,
  sanitizeInt,
  MAX_LENGTHS,
} from '@/lib/sanitize';

describe('sanitizeText', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('returns empty string for null/undefined input', () => {
    expect(sanitizeText(null as unknown as string)).toBe('');
    expect(sanitizeText(undefined as unknown as string)).toBe('');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeText(123 as unknown as string)).toBe('');
  });

  it('passes through normal text unchanged', () => {
    expect(sanitizeText('Hello, world!')).toBe('Hello, world!');
  });

  it('strips HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitizeText('<b>bold</b>')).toBe('bold');
    expect(sanitizeText('Hello <img src=x onerror=alert(1)> world')).toBe('Hello  world');
  });

  it('removes null bytes', () => {
    expect(sanitizeText('hello\0world')).toBe('helloworld');
    expect(sanitizeText('\0\0\0')).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('enforces default max length (mediumText = 2000)', () => {
    const longStr = 'a'.repeat(3000);
    expect(sanitizeText(longStr).length).toBe(MAX_LENGTHS.mediumText);
  });

  it('enforces custom max length', () => {
    const longStr = 'a'.repeat(300);
    expect(sanitizeText(longStr, 100).length).toBe(100);
  });

  it('blocks XSS attempts with nested tags', () => {
    expect(sanitizeText('<div><script>alert(1)</script></div>')).toBe('alert(1)');
  });

  it('blocks XSS with event handlers', () => {
    expect(sanitizeText('<img src="x" onerror="alert(1)">')).toBe('');
  });

  it('handles text with only HTML tags', () => {
    expect(sanitizeText('<br><hr><div></div>')).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('returns empty string for null/undefined input', () => {
    expect(sanitizeUrl(null as unknown as string)).toBe('');
    expect(sanitizeUrl(undefined as unknown as string)).toBe('');
  });

  it('allows valid https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });

  it('allows valid http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
    expect(sanitizeUrl('JavaScript:void(0)')).toBe('');
  });

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:MsgBox("xss")')).toBe('');
  });

  it('blocks file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('auto-prepends https:// for domain-like strings', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com');
    expect(sanitizeUrl('www.example.com')).toBe('https://www.example.com');
    expect(sanitizeUrl('sub.domain.co.uk')).toBe('https://sub.domain.co.uk');
  });

  it('returns empty for non-URL strings without protocol', () => {
    expect(sanitizeUrl('not a url')).toBe('');
    expect(sanitizeUrl('ftp://files.example.com')).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('enforces max URL length', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(3000);
    expect(sanitizeUrl(longUrl).length).toBeLessThanOrEqual(MAX_LENGTHS.url);
  });
});

describe('sanitizeEmail', () => {
  it('returns valid email normalized to lowercase', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('returns valid simple email unchanged', () => {
    expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
  });

  it('returns empty string for invalid email (no @)', () => {
    expect(sanitizeEmail('invalid-email')).toBe('');
  });

  it('returns empty string for invalid email (no domain)', () => {
    expect(sanitizeEmail('user@')).toBe('');
  });

  it('returns empty string for invalid email (no TLD)', () => {
    expect(sanitizeEmail('user@domain')).toBe('');
  });

  it('returns empty for empty input', () => {
    expect(sanitizeEmail('')).toBe('');
  });

  it('returns empty for null/undefined input', () => {
    expect(sanitizeEmail(null as unknown as string)).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('enforces max email length', () => {
    const longLocal = 'a'.repeat(300);
    const longEmail = `${longLocal}@example.com`;
    const result = sanitizeEmail(longEmail);
    // Should still be valid or empty depending on length
    expect(result.length).toBeLessThanOrEqual(MAX_LENGTHS.email);
  });
});

describe('sanitizePhone', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizePhone('')).toBe('');
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizePhone(null as unknown as string)).toBe('');
  });

  it('keeps digits', () => {
    expect(sanitizePhone('1234567890')).toBe('1234567890');
  });

  it('keeps spaces, parentheses, hyphens, and plus', () => {
    expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
  });

  it('strips letters and special characters', () => {
    expect(sanitizePhone('abc123!@#def456')).toBe('123456');
  });

  it('strips emojis and unicode', () => {
    expect(sanitizePhone('123\u{1F600}456')).toBe('123456');
  });

  it('enforces max phone length', () => {
    const longPhone = '1'.repeat(50);
    expect(sanitizePhone(longPhone).length).toBeLessThanOrEqual(MAX_LENGTHS.phone);
  });

  it('trims whitespace', () => {
    expect(sanitizePhone('  123  ')).toBe('123');
  });
});

describe('sanitizeInt', () => {
  it('parses valid integer string', () => {
    expect(sanitizeInt('42')).toBe(42);
  });

  it('returns null for NaN input', () => {
    expect(sanitizeInt('abc')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(sanitizeInt('')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(sanitizeInt(null as unknown as string)).toBeNull();
    expect(sanitizeInt(undefined as unknown as string)).toBeNull();
  });

  it('enforces default min (0)', () => {
    expect(sanitizeInt('-1')).toBeNull();
  });

  it('enforces default max (100000)', () => {
    expect(sanitizeInt('100001')).toBeNull();
    expect(sanitizeInt('100000')).toBe(100000);
  });

  it('enforces custom min', () => {
    expect(sanitizeInt('5', 10, 100)).toBeNull();
    expect(sanitizeInt('10', 10, 100)).toBe(10);
  });

  it('enforces custom max', () => {
    expect(sanitizeInt('101', 0, 100)).toBeNull();
    expect(sanitizeInt('100', 0, 100)).toBe(100);
  });

  it('parses integer from float string (truncates)', () => {
    expect(sanitizeInt('42.9')).toBe(42);
  });

  it('returns 0 for "0"', () => {
    expect(sanitizeInt('0')).toBe(0);
  });
});

describe('sanitizeCSVValue', () => {
  it('returns empty quoted string for empty input', () => {
    expect(sanitizeCSVValue('')).toBe('');
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizeCSVValue(null as unknown as string)).toBe('');
  });

  it('wraps normal text in double quotes', () => {
    expect(sanitizeCSVValue('hello world')).toBe('"hello world"');
  });

  it('escapes double quotes by doubling them', () => {
    expect(sanitizeCSVValue('say "hello"')).toBe('"say ""hello"""');
  });

  it('prefixes formula injection with = sign', () => {
    expect(sanitizeCSVValue('=SUM(A1:A10)')).toBe("\"'=SUM(A1:A10)\"");
  });

  it('prefixes formula injection with + sign', () => {
    expect(sanitizeCSVValue('+cmd|"/C calc"!A0')).toBe("\"'+cmd|\"\"/C calc\"\"!A0\"");
  });

  it('prefixes formula injection with - sign', () => {
    expect(sanitizeCSVValue('-1+1')).toBe("\"'-1+1\"");
  });

  it('prefixes formula injection with @ sign', () => {
    expect(sanitizeCSVValue('@SUM(A1)')).toBe("\"'@SUM(A1)\"");
  });

  it('prefixes formula injection with tab character', () => {
    expect(sanitizeCSVValue('\tcmd')).toBe("\"'\tcmd\"");
  });

  it('handles text that does not start with dangerous chars', () => {
    expect(sanitizeCSVValue('safe text')).toBe('"safe text"');
  });
});
