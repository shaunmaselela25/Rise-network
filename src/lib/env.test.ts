import { describe, expect, it, vi } from 'vitest';
import { readBackendConfig } from './env';

const key = 'x'.repeat(40);

describe('readBackendConfig', () => {
  it('returns null when the backend is not configured', () => {
    expect(readBackendConfig({})).toBeNull();
    expect(readBackendConfig({ VITE_SUPABASE_URL: ' ', VITE_SUPABASE_ANON_KEY: key })).toBeNull();
  });

  it('returns the configuration when valid', () => {
    expect(
      readBackendConfig({
        VITE_SUPABASE_URL: 'http://127.0.0.1:55321',
        VITE_SUPABASE_ANON_KEY: key,
      }),
    ).toEqual({ url: 'http://127.0.0.1:55321', anonKey: key });
  });

  it('rejects a non-http URL and logs without exposing the key', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      readBackendConfig({ VITE_SUPABASE_URL: 'javascript:alert(1)', VITE_SUPABASE_ANON_KEY: key }),
    ).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(key);
  });
});
