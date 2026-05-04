import { createBrowserClient } from '@supabase/ssr';
import { environment } from '../environment';

export function createClient() {
  return createBrowserClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );
}
