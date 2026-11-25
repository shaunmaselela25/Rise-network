import { Link } from 'react-router';
import { usePageTitle } from '../../lib/usePageTitle';

export function StaffHomePage() {
  usePageTitle('Staff');
  return (
    <div className="container prose">
      <h1>Staff</h1>
      <p>
        Tools for RISE NETWORK moderators and administrators. Every change is recorded in the audit
        log.
      </p>
      <ul>
        <li>
          <Link to="/moderation">Moderation</Link> — review submitted opportunities, published
          listings and reports.
        </li>
        <li>
          <Link to="/staff/learning">Learning resources</Link> — add, edit, publish and archive
          learning resources.
        </li>
        <li>
          <Link to="/staff/careers">Career guides</Link> — add, edit, publish and archive career
          guidance.
        </li>
      </ul>
    </div>
  );
}
