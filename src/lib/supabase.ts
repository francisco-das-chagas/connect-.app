import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | null = null

// Colocámos as tuas chaves fixas aqui para forçar a ligação!
const SUPABASE_URL = 'https://sjgtriryzpjzmhjcikbk.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZ3RyaXJ5enBqem1oamNpa2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MDc0NjgsImV4cCI6MjA4OTQ4MzQ2OH0.SRYnlNl1hDX9-jUmdRqtOhuj2zigoB-BhBBybs1z5Z8'

export function createSupabaseBrowser() {
  if (_client) return _client

  _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      lock: async (
        _name: string,
        _acquireTimeout: number,
        fn: () => Promise<unknown>
      ) => {
        return await fn()
      }
    }
  })
  return _client
}
