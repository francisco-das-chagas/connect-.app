'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

const AUTH_TIMEOUT_MS = 4000; // Max wait for auth resolution

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const mountedRef = useRef(true);
  const loadingResolvedRef = useRef(false);

  const supabase = useMemo(() => createSupabaseBrowser(), []);

  useEffect(() => {
    mountedRef.current = true;
    loadingResolvedRef.current = false;

    const setLoadingOnce = (value: boolean) => {
      if (!mountedRef.current) return;
      if (!value && loadingResolvedRef.current) return; // Already resolved
      if (!value) loadingResolvedRef.current = true;
      setLoading(value);
    };

    const initAuth = async () => {
      try {
        // Step 1: Quick session from storage (instant, no network)
        const { data: { session: localSession } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (localSession?.user) {
          setSession(localSession);
          setUser(localSession.user);
          setLoadingOnce(false); // Instant UI

          // Step 2: Background server validation (non-blocking)
          supabase.auth.getUser().then(({ data: { user: validatedUser }, error }) => {
            if (!mountedRef.current) return;
            if (error || !validatedUser) {
              console.warn('Auth token invalid, clearing session');
              setSession(null);
              setUser(null);
            } else {
              setUser(validatedUser);
            }
          }).catch(() => {
            // Network fail — keep local session, user stays logged in
          });
        } else {
          // No local session — quick server check with timeout
          try {
            const result = await Promise.race([
              supabase.auth.getUser(),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTH_TIMEOUT_MS)),
            ]);

            if (!mountedRef.current) return;

            if (result && 'data' in result && result.data.user) {
              const { data: { session: freshSession } } = await supabase.auth.getSession();
              if (!mountedRef.current) return;
              setSession(freshSession);
              setUser(result.data.user);
            } else {
              setSession(null);
              setUser(null);
            }
          } catch {
            if (mountedRef.current) {
              setSession(null);
              setUser(null);
            }
          }
          setLoadingOnce(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setLoadingOnce(false);
        }
      }
    };

    initAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mountedRef.current) return;
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoadingOnce(false);
      }
    );

    // Safety net: NEVER hang forever
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoadingOnce(false);
      }
    }, AUTH_TIMEOUT_MS + 1000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/');
  }, [supabase, router]);

  return { user, session, loading, signOut };
}
