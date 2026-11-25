import { RequireAuth } from '../auth/RequireAuth';
import { EditSubmissionPage } from './EditSubmissionPage';
import { MySubmissionsPage } from './MySubmissionsPage';
import { SavedPage } from './SavedPage';
import { SubmitOpportunityPage } from './SubmitOpportunityPage';

/** Signed-in-only pages, wrapped for lazy routing. */
export function SubmitRoute() {
  return (
    <RequireAuth>
      <SubmitOpportunityPage />
    </RequireAuth>
  );
}

export function MySubmissionsRoute() {
  return (
    <RequireAuth>
      <MySubmissionsPage />
    </RequireAuth>
  );
}

export function EditSubmissionRoute() {
  return (
    <RequireAuth>
      <EditSubmissionPage />
    </RequireAuth>
  );
}

export function SavedRoute() {
  return (
    <RequireAuth>
      <SavedPage />
    </RequireAuth>
  );
}
