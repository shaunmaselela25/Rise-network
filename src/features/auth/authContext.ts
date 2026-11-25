import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthStatus = 'unavailable' | 'loading' | 'signed_out' | 'signed_in';

export type AppRole = 'moderator' | 'admin';

export interface AuthState {
  /** `unavailable` means the backend is not configured in this environment. */
  status: AuthStatus;
  session: Session | null;
  /**
   * Elevated roles of the signed-in user. Used only to decide what to show; every
   * privileged action is authorised again by the database.
   */
  roles: AppRole[];
}

export const AuthContext = createContext<AuthState>({
  status: 'loading',
  session: null,
  roles: [],
});

export function isStaff(roles: AppRole[]): boolean {
  return roles.includes('moderator') || roles.includes('admin');
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
