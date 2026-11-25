import { Link } from 'react-router';
import { FormStatus } from '../../components/form/FormStatus';
import { usePageTitle } from '../../lib/usePageTitle';

export function AccountDeletedPage() {
  usePageTitle('Account deleted');
  return (
    <div className="container prose">
      <h1>Your account has been deleted</h1>
      <FormStatus kind="success">
        <p>Your account, profile and saved opportunities have been deleted.</p>
      </FormStatus>
      <p>You can still browse RISE NETWORK without an account.</p>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
