import { Link } from 'react-router';
import { usePageTitle } from '../../lib/usePageTitle';

export function AboutPage() {
  usePageTitle('About');
  return (
    <div className="container prose">
      <h1>About RISE NETWORK</h1>
      <p className="lead">
        RISE NETWORK is a South African community opportunity platform. We bring together
        information about opportunities for education, skills development, careers, mentorship and
        community participation, so that young people can find them more easily.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Collect opportunity information and record where it came from.</li>
        <li>Review listings before they are published, and label how far they were checked.</li>
        <li>Show eligibility, documents, costs and deadlines clearly.</li>
        <li>Link you to the official provider so you can apply directly.</li>
        <li>Remove or mark listings that have closed or have been reported as incorrect.</li>
      </ul>

      <h2>What we are not</h2>
      <p>
        RISE NETWORK is not a recruitment agency, employer, funder, bank or accredited education
        provider. We do not process applications and we cannot guarantee a bursary, admission, job,
        funding or mentorship. Decisions are always made by the organisation offering the
        opportunity.
      </p>

      <h2>How listings are checked</h2>
      <p>Each published opportunity will carry a verification label, for example:</p>
      <dl>
        <dt>
          <strong>Source checked</strong>
        </dt>
        <dd>A reviewer confirmed the details against the provider’s official source.</dd>
        <dt>
          <strong>Provider confirmed</strong>
        </dt>
        <dd>The organisation offering the opportunity confirmed the details to us.</dd>
        <dt>
          <strong>Needs rechecking</strong> or <strong>Disputed</strong>
        </dt>
        <dd>The listing may be out of date or has been reported, and is under review.</dd>
      </dl>
      <p>
        Even so, always confirm the details on the provider’s official website before you apply.
      </p>

      <h2>Current status</h2>
      <p>
        RISE NETWORK is being built. See what is planned on the{' '}
        <Link to="/opportunities">Opportunities</Link>, <Link to="/learning">Learning</Link> and{' '}
        <Link to="/careers">Careers</Link> pages.
      </p>
    </div>
  );
}
