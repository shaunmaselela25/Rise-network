import type { Session } from '@supabase/supabase-js';
import { vi } from 'vitest';

/** Minimal Supabase client double for component tests. */
export function createMockSupabase(initialSession: Session | null = null) {
  let authListener: ((event: string, session: Session | null) => void) | null = null;

  const profileQuery = {
    select: vi.fn(() => profileQuery),
    update: vi.fn(() => profileQuery),
    eq: vi.fn(() => profileQuery),
    single: vi.fn(() =>
      Promise.resolve({
        data: { display_name: 'Thandi', province: 'gauteng', education_level: null },
        error: null,
      }),
    ),
  };

  const client = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: initialSession } })),
      onAuthStateChange: vi.fn((callback: (event: string, session: Session | null) => void) => {
        authListener = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signUp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      updateUser: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => profileQuery),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    emitAuthChange(session: Session | null) {
      authListener?.(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    },
    profileQuery,
  };
  return client;
}

export function fakeSession(email = 'thandi@example.com'): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-11-25T00:00:00Z',
    },
  } as Session;
}
