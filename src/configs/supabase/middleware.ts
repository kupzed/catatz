import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { environment } from '../environment';

function revokeSessionAndRedirect(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL("/login?message=session-revoked", request.url)
  );
  const allCookies = request.cookies.getAll();
  allCookies.forEach(({ name }) => {
    if (name.startsWith("sb-") || name === "device_id") {
      response.cookies.delete(name);
    }
  });
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const hasAuthCode = request.nextUrl.searchParams.has('code');

  if (
    hasAuthCode &&
    (pathname.startsWith('/login') || pathname.startsWith('/register'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: environment.isProduction,
            })
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const isAuthPage =
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');
  const isAuthCallback = pathname.startsWith('/auth/callback');
  const isProtected = !isAuthPage && !isAuthCallback && pathname !== '/';

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }


  // Cek apakah session saat ini valid dan tidak di-revoke
  if (isProtected && user) {
    const deviceId = request.cookies.get("device_id")?.value;

    if (!deviceId) {
      // Keamanan (Option A: Strict): Wajibkan keberadaan device_id cookie pada protected route.
      // Menolak akses jika cookie device_id dihilangkan untuk menghindari bypass status revoke.
      return revokeSessionAndRedirect(request);
    }

    const { data: sessionData } = await supabase
      .from("user_sessions")
      .select("revoked_at")
      .eq("device_id", deviceId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionData && sessionData.revoked_at !== null) {
      // Hapus cookie sesi karena telah di-revoke
      return revokeSessionAndRedirect(request);
    }
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
