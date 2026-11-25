import { Link } from 'react-router';
import { usePageTitle } from '../../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="container prose">
      <h1>Page not found</h1>
      <p>We could not find the page you were looking for. It may have moved or no longer exist.</p>
      <p>
        <Link className="button button--primary" to="/">
          Go to the home page
        </Link>
      </p>
    </div>
  );
}
