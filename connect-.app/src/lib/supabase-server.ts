import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// For server components / route handlers (reads cookies for auth)
export async function createSupabaseServer() {
  // During build/prerender env vars may be empty — use placeholder to avoid crash
  const url = SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = SUPABASE_ANON_KEY || 'placeholder-key';

  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Component context where
            // cookies can't be set. This is expected - ignore silently.
          }
        },
      },
    }
  );
}
