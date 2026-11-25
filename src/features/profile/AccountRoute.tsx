import { RequireAuth } from '../auth/RequireAuth';
import { AccountPage } from './AccountPage';

export function AccountRoute() {
  return (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  );
}
