import { useEffect, useState, type ReactNode } from 'react';
import { isBackendConfigured } from '../../lib/backendFlag';
import { AuthContext, type AuthState } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isBackendConfigured()
      ? { status: 'loading', session: null }
      : { status: 'unavailable', session: null },
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
          setState({ status: 'unavailable', session: null });
          return;
        }
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) setState({ status: session ? 'signed_in' : 'signed_out', session });
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        const { data } = await supabase.auth.getSession();
        if (active) {
          setState({ status: data.session ? 'signed_in' : 'signed_out', session: data.session });
        }
      })
      .catch(() => {
        if (active) setState({ status: 'signed_out', session: null });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
