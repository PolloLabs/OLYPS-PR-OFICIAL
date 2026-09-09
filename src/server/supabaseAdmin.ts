import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseConfig } from './config/env.js';

let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Returns the Supabase Admin client instance initialized with Service Role Key.
 * Lazy-initialized to prevent server startup crash if credentials are not configured yet.
 * 
 * CAUTION: Never expose or export this instance to client-side code.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const { supabaseUrl, supabaseServiceRoleKey, isConfigured } = getServerSupabaseConfig();

  if (!isConfigured) {
    throw new Error('Supabase Admin não pôde ser inicializado: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.');
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
}

/**
 * Checks if the backend Supabase Admin client is configured with necessary credentials.
 */
export function isSupabaseAdminConfigured(): boolean {
  const { isConfigured } = getServerSupabaseConfig();
  return isConfigured;
}
