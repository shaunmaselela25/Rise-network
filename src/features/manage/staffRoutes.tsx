import { RequireStaff } from '../auth/RequireStaff';
import { CareerEditorPage } from './CareerEditorPage';
import { LearningEditorPage } from './LearningEditorPage';
import { ManageListPage } from './ManageListPage';
import { StaffHomePage } from './StaffHomePage';

/** Staff-only content management pages, wrapped for lazy routing. */
export function StaffHomeRoute() {
  return (
    <RequireStaff>
      <StaffHomePage />
    </RequireStaff>
  );
}

export function ManageLearningRoute() {
  return (
    <RequireStaff>
      <ManageListPage kind="learning" />
    </RequireStaff>
  );
}

export function LearningEditorRoute() {
  return (
    <RequireStaff>
      <LearningEditorPage />
    </RequireStaff>
  );
}

export function ManageCareersRoute() {
  return (
    <RequireStaff>
      <ManageListPage kind="careers" />
    </RequireStaff>
  );
}

export function CareerEditorRoute() {
  return (
    <RequireStaff>
      <CareerEditorPage />
    </RequireStaff>
  );
}
