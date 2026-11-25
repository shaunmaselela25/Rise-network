import { Link } from 'react-router';
import { Notice } from '../../components/Notice';
import { usePageTitle } from '../../lib/usePageTitle';

export const PRIVACY_NOTICE_VERSION = '0.1-draft';

export function PrivacyPage() {
  usePageTitle('Privacy notice');
  return (
    <div className="container prose">
      <h1>Privacy notice</h1>
      <Notice title="Draft — pending legal review">
        <p>
          This is a working draft (version {PRIVACY_NOTICE_VERSION}). It is not legal advice and
          will be reviewed before RISE NETWORK launches accounts or collects personal information.
        </p>
      </Notice>

      <h2>What we collect today</h2>
      <p>
        The current version of this website does not offer accounts, forms or tracking, and does not
        collect personal information from you. Our hosting provider may keep standard technical
        server logs (such as IP address and browser type) to operate and secure the service.
      </p>

      <h2>What we plan to collect when accounts launch</h2>
      <p>
        We intend to collect only what is needed to run the service, in line with the Protection of
        Personal Information Act (POPIA):
      </p>
      <ul>
        <li>Email address and password (to create and secure your account).</li>
        <li>A display name, and optionally your province, education level and interests.</li>
        <li>The opportunities you save and the progress you record.</li>
        <li>Reports and submissions you make, and records of your consent to our terms.</li>
      </ul>
      <p>
        We do not plan to collect identity numbers, financial information or health information.
        Before accounts launch, this notice will set out the purpose of each item, how long it is
        kept, who can access it, where it is stored, and how to access, correct or delete it.
      </p>

      <h2>Your rights</h2>
      <p>
        Under POPIA you have the right to know what personal information is held about you, to ask
        for it to be corrected or deleted, and to object to processing. You may also lodge a
        complaint with the Information Regulator of South Africa. Contact details for requests will
        be published on the <Link to="/contact">Contact</Link> page.
      </p>
    </div>
  );
}
