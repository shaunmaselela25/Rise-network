import { Notice } from '../../components/Notice';
import { usePageTitle } from '../../lib/usePageTitle';

export const REPOSITORY_ISSUES_URL = 'https://github.com/shaunmaselela25/Rise-network/issues';

export function ContactPage() {
  usePageTitle('Contact');
  return (
    <div className="container prose">
      <h1>Contact</h1>
      <Notice title="Official contact details coming soon">
        <p>
          RISE NETWORK will publish an official contact channel for general enquiries, listing
          corrections and personal-information requests before the platform launches.
        </p>
      </Notice>
      <h2>Reporting a problem with this website</h2>
      <p>
        If you find a technical problem with the website, you can report it on our{' '}
        <a href={REPOSITORY_ISSUES_URL} target="_blank" rel="noopener noreferrer">
          public issue tracker<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        . Do not include personal information there, because issues are public.
      </p>
    </div>
  );
}
