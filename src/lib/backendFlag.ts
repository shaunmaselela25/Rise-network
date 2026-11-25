/**
 * Cheap check (no dependencies) for whether backend configuration is present, so the
 * initial bundle does not need to load the Supabase client or zod. Full validation
 * happens in env.ts when the client is created.
 */
export function isBackendConfigured(
  env: Record<string, string | undefined> = import.meta.env,
): boolean {
  return Boolean(env.VITE_SUPABASE_URL?.trim() && env.VITE_SUPABASE_ANON_KEY?.trim());
}
