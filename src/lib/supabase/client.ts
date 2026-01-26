import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey, isMockMode } from '@/lib/env/public';

export function createClient() {
  if (isMockMode) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
