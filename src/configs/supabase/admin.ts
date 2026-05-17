import { createClient } from '@supabase/supabase-js';
import { environment } from '../environment';

/**
 * Creates a Supabase Admin Client using the Service Role Key.
 * DANGER: This client bypasses RLS policies. It should ONLY be used
 * on the server, and ONLY for tasks that require elevated privileges
 * (such as deleting an auth.users record).
 */
export function createAdminClient() {
  if (!environment.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in the environment');
  }

  return createClient(
    environment.supabaseUrl,
    environment.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
}
