import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { RequireAuth } from './RequireAuth';
import { isStaff, useAuth } from './authContext';

/**
 * Hides staff screens from non-staff. Usability only — the database rejects
 * privileged reads and writes from non-staff regardless of what the UI shows.
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <StaffOnly>{children}</StaffOnly>
    </RequireAuth>
  );
}

function StaffOnly({ children }: { children: ReactNode }) {
  const { roles } = useAuth();
  if (!isStaff(roles)) {
    return (
      <div className="container prose">
        <h1>Not authorised</h1>
        <p>This page is only available to RISE NETWORK moderators and administrators.</p>
        <p>
          <Link to="/">Go to the home page</Link>
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
