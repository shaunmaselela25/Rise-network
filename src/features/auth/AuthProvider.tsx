import { useEffect, useState, type ReactNode } from 'react';
import { isBackendConfigured } from '../../lib/backendFlag';
import type { Session } from '@supabase/supabase-js';
import type { RiseSupabaseClient } from '../../lib/supabase';
import { AuthContext, type AppRole, type AuthState } from './authContext';

async function loadRoles(
  supabase: RiseSupabaseClient,
  session: Session | null,
): Promise<AppRole[]> {
  if (!session) return [];
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id);
  return error || !data ? [] : data.map((row) => row.role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isBackendConfigured()
      ? { status: 'loading', session: null, roles: [] }
      : { status: 'unavailable', session: null, roles: [] },
  );

  useEffect(() => {
    if (!isBackendConfigured()) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    // Load the Supabase client after first render so public pages stay light (NFR-001).
    import('../../lib/supabase')
      .then(async ({ getSupabase }) => {
        const supabase = getSupabase();
        if (!active) return;
        if (!supabase) {
          setState({ status: 'unavailable', session: null, roles: [] });
          return;
        }
        const apply = async (session: Session | null) => {
          const roles = await loadRoles(supabase, session);
          if (active) setState({ status: session ? 'signed_in' : 'signed_out', session, roles });
        };
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          // Defer: calling Supabase inside this callback can deadlock the auth client.
          setTimeout(() => void apply(session), 0);
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        const { data } = await supabase.auth.getSession();
        await apply(data.session);
      })
      .catch(() => {
        if (active) setState({ status: 'signed_out', session: null, roles: [] });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
