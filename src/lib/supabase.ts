import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { readBackendConfig } from './env';

export type RiseSupabaseClient = SupabaseClient<Database>;

let client: RiseSupabaseClient | null | undefined;

/** Returns the shared Supabase client, or null when the backend is not configured. */
export function getSupabase(): RiseSupabaseClient | null {
  if (client !== undefined) return client;
  const config = readBackendConfig();
  client = config
    ? createClient<Database>(config.url, config.anonKey, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true },
      })
    : null;
  return client;
}
