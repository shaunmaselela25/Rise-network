import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './authContext';
import { AccountsUnavailable } from './AccountsUnavailable';

/**
 * Client-side route guard for signed-in pages. This is a usability feature only:
 * data access is enforced by Row Level Security in the database.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'unavailable') return <AccountsUnavailable />;
  if (status === 'loading') {
    return (
      <div className="container" role="status">
        Loading…
      </div>
    );
  }
  if (status === 'signed_out') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <>{children}</>;
}
