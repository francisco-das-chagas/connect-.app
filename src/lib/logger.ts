/**
 * Lightweight logger that suppresses debug output in production.
 * Usage: import { logger } from '@/lib/logger';
 *        logger.error('Something failed', error);
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    console.error(`[CV] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(`[CV] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(`[CV] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(`[CV:debug] ${message}`, ...args);
  },
};
