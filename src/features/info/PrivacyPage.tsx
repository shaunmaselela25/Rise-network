import { Link } from 'react-router';
import { Notice } from '../../components/Notice';
import { PRIVACY_NOTICE_VERSION } from '../../lib/policies';
import { usePageTitle } from '../../lib/usePageTitle';

export function PrivacyPage() {
  usePageTitle('Privacy notice');
  return (
    <div className="container prose">
      <h1>Privacy notice</h1>
      <Notice title="Draft — pending legal review">
        <p>
          This is a working draft (version {PRIVACY_NOTICE_VERSION}). It is not legal advice and
          will be reviewed before RISE NETWORK launches publicly.
        </p>
      </Notice>

      <h2>Browsing without an account</h2>
      <p>
        You can browse RISE NETWORK without an account. We do not use advertising or tracking
        cookies. Our hosting and database providers keep standard technical logs (such as IP address
        and browser type) to operate and secure the service.
      </p>

      <h2>If you create an account</h2>
      <p>
        Accounts are for people aged 18 and over. We collect only what we need to run your account,
        in line with the Protection of Personal Information Act (POPIA):
      </p>
      <ul>
        <li>
          <strong>Email address and password</strong> — to create and secure your account. Your
          password is stored only in hashed form by our authentication provider.
        </li>
        <li>
          <strong>Name to display</strong> — used to personalise your account. It is not shown
          publicly.
        </li>
        <li>
          <strong>Province and highest qualification</strong> — optional, to help show relevant
          opportunities. You can leave these blank or clear them at any time.
        </li>
        <li>
          <strong>Confirmation that you are 18 or older</strong>, and a record of when you accepted
          our terms and this notice, including their version numbers.
        </li>
        <li>
          <strong>Opportunities you save, opportunities you submit and reports you make</strong>,
          once those features are available.
        </li>
      </ul>
      <p>
        We do not collect identity numbers, financial information or health information. We do not
        sell personal information.
      </p>

      <h2>Who can see your information</h2>
      <p>
        Your profile and saved opportunities are visible only to you. Authorised RISE NETWORK
        administrators can access account information when needed to run and protect the service,
        and their important actions are logged. Our database and authentication provider processes
        this information on our behalf.
      </p>

      <h2>Deleting your account</h2>
      <p>
        You can delete your account at any time from the <Link to="/account">My account</Link> page.
        This deletes your account, profile, saved opportunities and consent records. Opportunities
        you submitted that were published remain on RISE NETWORK but are no longer linked to you.
      </p>

      <h2>Your rights</h2>
      <p>
        Under POPIA you have the right to know what personal information is held about you, to ask
        for it to be corrected or deleted, and to object to processing. You may also lodge a
        complaint with the Information Regulator of South Africa. Contact details for requests will
        be published on the <Link to="/contact">Contact</Link> page.
      </p>

      <h2>Still to be confirmed before launch</h2>
      <p>
        Before public launch this notice will name the responsible party and Information Officer,
        state where data is stored (including any storage outside South Africa) and set out
        retention periods.
      </p>
    </div>
  );
}
