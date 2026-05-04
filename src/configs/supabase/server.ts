import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { environment } from '../environment';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                secure: environment.isProduction,
              })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
