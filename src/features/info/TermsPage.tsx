import { Notice } from '../../components/Notice';
import { usePageTitle } from '../../lib/usePageTitle';

export const TERMS_VERSION = '0.1-draft';

export function TermsPage() {
  usePageTitle('Terms of use');
  return (
    <div className="container prose">
      <h1>Terms of use</h1>
      <Notice title="Draft — pending legal review">
        <p>
          This is a working draft (version {TERMS_VERSION}). It is not legal advice and will be
          reviewed before RISE NETWORK launches accounts.
        </p>
      </Notice>

      <h2>About the information on RISE NETWORK</h2>
      <p>
        RISE NETWORK publishes information about opportunities offered by other organisations. We
        review listings and record their sources, but providers can change or withdraw opportunities
        at any time. Always confirm details with the provider before applying.
      </p>

      <h2>No guarantees</h2>
      <p>
        Listing an opportunity does not mean that you will be selected. RISE NETWORK does not offer,
        fund or decide on any bursary, scholarship, programme, job or admission, and is not
        responsible for decisions made by providers.
      </p>

      <h2>Acceptable use</h2>
      <p>When features that accept contributions launch, you agree not to:</p>
      <ul>
        <li>Submit false, misleading or fraudulent opportunities.</li>
        <li>Impersonate another person or organisation.</li>
        <li>Harass other users or post unlawful content.</li>
        <li>Attempt to access accounts or data that are not yours.</li>
      </ul>

      <h2>Changes to these terms</h2>
      <p>
        We will publish updated versions of these terms on this page, with a version number and
        date.
      </p>
    </div>
  );
}
