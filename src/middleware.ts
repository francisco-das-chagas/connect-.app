import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware if Supabase env vars are missing (build/CI)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper: create redirect that preserves auth cookies set by getUser() token refresh
  function safeRedirect(pathname: string): NextResponse {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    // Copy any cookies that setAll put on the response (e.g. refreshed tokens)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
        maxAge: cookie.maxAge,
      });
    });
    return redirectResponse;
  }

  // Protected routes
  const protectedPaths = ['/evento', '/admin', '/completar-perfil', '/sponsor-portal'];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    // return safeRedirect('/login');
  }

  // Server-side role check for /admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    try {
      const { data: attendee } = await supabase
        .from('event_attendees')
        .select('ticket_type')
        .eq('user_id', user.id)
        .in('ticket_type', ['admin', 'organizer'])
        .maybeSingle();

      if (!attendee) {
        return safeRedirect('/evento');
      }
    } catch {
      // Fail-closed: deny access when role check fails
      return safeRedirect('/evento');
    }
  }

  // Server-side check for /sponsor-portal — must be sponsor or admin
  if (user && request.nextUrl.pathname.startsWith('/sponsor-portal')) {
    try {
      const { data: attendee } = await supabase
        .from('event_attendees')
        .select('ticket_type')
        .eq('user_id', user.id)
        .in('ticket_type', ['sponsor', 'admin', 'organizer'])
        .maybeSingle();

      if (!attendee) {
        return safeRedirect('/evento');
      }
    } catch {
      // Fail-closed: deny access when role check fails
      return safeRedirect('/evento');
    }
  }

  // Redirect logged-in users away from login
  if (request.nextUrl.pathname === '/login' && user) {
    return safeRedirect('/evento');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|api).*)',
  ],
};
