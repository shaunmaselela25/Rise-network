import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { usePageTitle } from '../lib/usePageTitle';

/**
 * Rendered when a route throws. Shows a safe, generic message; technical details
 * are logged to the console only (never shown to users).
 */
export function RouteErrorPage() {
  const error = useRouteError();
  usePageTitle('Something went wrong');

  if (!isRouteErrorResponse(error)) {
    console.error(error);
  }

  return (
    <div className="container prose" role="alert" style={{ paddingBlock: 'var(--space-7)' }}>
      <h1>Something went wrong</h1>
      <p>
        We could not display this page. Please try again. If the problem continues, return to the
        home page.
      </p>
      <p>
        <Link className="button button--primary" to="/">
          Go to the home page
        </Link>
      </p>
    </div>
  );
}
