import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthStatus = 'unavailable' | 'loading' | 'signed_out' | 'signed_in';

export interface AuthState {
  /** `unavailable` means the backend is not configured in this environment. */
  status: AuthStatus;
  session: Session | null;
}

export const AuthContext = createContext<AuthState>({ status: 'loading', session: null });

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
