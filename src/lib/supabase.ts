import { createBrowserClient } from '@supabase/ssr';

let _client: ReturnType<typeof createBrowserClient> | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function createSupabaseBrowser() {
  if (_client) return _client;

  // During build/prerender env vars may be empty — return a dummy client
  // that will be recreated on the browser with real values
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (typeof window === 'undefined') {
      // SSR/build: return a stub that won't crash
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key',
      );
    }
    console.error('Supabase env vars missing at runtime');
  }

  _client = createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => {
          return await fn();
        },
      },
    }
  );
  return _client;
}
