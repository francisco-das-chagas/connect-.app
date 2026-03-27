/**
 * Input sanitization utilities.
 * Prevents XSS, HTML injection, and enforces data limits.
 */

// Max lengths for different field types
export const MAX_LENGTHS = {
  name: 200,
  email: 254,
  phone: 30,
  cpf: 14,
  company: 200,
  jobTitle: 200,
  url: 2048,
  shortText: 500,    // taglines, titles, codes
  mediumText: 2000,  // descriptions, messages, notes
  longText: 5000,    // large text areas
} as const;

/**
 * Strip HTML tags and dangerous characters from text input.
 * Prevents XSS when text is rendered or stored in DB.
 */
export function sanitizeText(input: string, maxLength: number = MAX_LENGTHS.mediumText): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
    // Enforce max length
    .slice(0, maxLength);
}

/**
 * Sanitize a URL input.
 * Only allows http/https protocols, prevents javascript: and data: URLs.
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim().slice(0, MAX_LENGTHS.url);

  // Block dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }

  // Only allow http/https URLs
  if (trimmed && !lower.startsWith('http://') && !lower.startsWith('https://')) {
    // If it looks like a domain, prepend https://
    if (/^[a-z0-9][\w.-]+\.[a-z]{2,}/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return '';
  }

  return trimmed;
}

/**
 * Sanitize email address.
 * Basic validation + length enforcement.
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim().toLowerCase().slice(0, MAX_LENGTHS.email);

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize phone number.
 * Keeps only digits, spaces, parentheses, hyphens, and plus.
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/[^\d\s()+-]/g, '')
    .trim()
    .slice(0, MAX_LENGTHS.phone);
}

/**
 * Sanitize value for CSV export.
 * Prevents CSV injection (formula injection) by prefixing dangerous characters.
 */
export function sanitizeCSVValue(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input.replace(/"/g, '""'); // Escape quotes

  // Prevent formula injection - prefix with single quote if starts with dangerous chars
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }

  return `"${sanitized}"`;
}

/**
 * Sanitize an integer input from string.
 * Returns null if invalid.
 */
export function sanitizeInt(input: string, min = 0, max = 100000): number | null {
  if (!input || typeof input !== 'string') return null;

  const num = parseInt(input, 10);
  if (isNaN(num) || num < min || num > max) return null;

  return num;
}
