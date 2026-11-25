import { RequireStaff } from '../auth/RequireStaff';
import { ModerationPage } from './ModerationPage';
import { ReviewPage } from './ReviewPage';

/** Staff-only pages, wrapped for lazy routing. */
export function ModerationRoute() {
  return (
    <RequireStaff>
      <ModerationPage />
    </RequireStaff>
  );
}

export function ReviewRoute() {
  return (
    <RequireStaff>
      <ReviewPage />
    </RequireStaff>
  );
}
