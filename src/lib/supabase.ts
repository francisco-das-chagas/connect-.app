import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseBrowser() {
  if (_client) return _client

  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )
  return _client
}
