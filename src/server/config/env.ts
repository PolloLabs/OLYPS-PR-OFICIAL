/**
 * Environment configuration validator for server-side execution.
 * Never logs or exposes secret values.
 */

export interface ServerEnvConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  isConfigured: boolean;
}

export function getServerSupabaseConfig(): ServerEnvConfig {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    isConfigured,
  };
}

export function validateServerEnv(): void {
  const config = getServerSupabaseConfig();

  if (!config.supabaseUrl) {
    console.warn('[WARN] SUPABASE_URL não configurada no servidor.');
  }

  if (!config.supabaseServiceRoleKey) {
    console.warn('[WARN] SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.');
  }
}
