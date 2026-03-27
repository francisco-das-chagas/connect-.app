import { createSupabaseBrowser } from './supabase';

export async function signInWithMagicLink(email: string) {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
  return { error };
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const supabase = createSupabaseBrowser();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
  return { error };
}

export async function signOut() {
  const supabase = createSupabaseBrowser();
  // Clear service worker caches before sign out to prevent stale/sensitive data
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (e) {
      console.warn('Failed to clear caches on sign out:', e);
    }
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
