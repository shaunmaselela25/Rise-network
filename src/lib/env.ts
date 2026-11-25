import { z } from 'zod';

const backendSchema = z.object({
  url: z.url({ protocol: /^https?$/, error: 'VITE_SUPABASE_URL must be an http(s) URL' }),
  anonKey: z.string().min(20, { error: 'VITE_SUPABASE_ANON_KEY looks invalid' }),
});

export type BackendConfig = z.infer<typeof backendSchema>;

/**
 * Reads the public Supabase configuration. Returns null when it is not configured, so the
 * public site still works (accounts are then shown as unavailable instead of failing).
 * Only public values belong here: never put a service-role key in a VITE_ variable.
 */
export function readBackendConfig(
  env: Record<string, string | undefined> = import.meta.env,
): BackendConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  const parsed = backendSchema.safeParse({ url, anonKey });
  if (!parsed.success) {
    console.error('Invalid Supabase configuration:', z.flattenError(parsed.error).fieldErrors);
    return null;
  }
  return parsed.data;
}
