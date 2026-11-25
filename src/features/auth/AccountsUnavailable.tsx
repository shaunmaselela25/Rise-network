import { Link } from 'react-router';
import { Notice } from '../../components/Notice';

/** Shown when the backend is not configured in this environment. */
export function AccountsUnavailable() {
  return (
    <div className="container prose">
      <h1>Accounts are not available</h1>
      <Notice title="Not available yet">
        <p>
          Accounts are not available on this version of RISE NETWORK. You can still browse public
          pages without an account.
        </p>
      </Notice>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
