import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { SelectField, TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { deadlineState, formatDate, formatTimestamp } from '../../lib/dates';
import { provinceLabels, qualificationLabels } from '../../lib/reference';
import { usePageTitle } from '../../lib/usePageTitle';
import { useAuth } from '../auth/authContext';
import {
  getOpportunityBySlug,
  isSaved,
  reportOpportunity,
  saveOpportunity,
  unsaveOpportunity,
  type PublicOpportunity,
} from './api';
import { DeadlineBadge, LoadError, Loading, VerificationBadge } from './components';
import {
  deliveryModeLabels,
  opportunityTypeLabels,
  reportReasonLabels,
  reportReasons,
  verificationInfo,
  type ReportReason,
} from './labels';
import styles from './opportunities.module.css';
import { errorMessage, useOpportunityData } from './useOpportunityData';

/** Defence in depth: the database already enforces https-only URLs. */
function safeExternalUrl(url: string | null): string | null {
  return url && /^https:\/\/[^\s]+$/.test(url) ? url : null;
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export function OpportunityDetailPage() {
  const { slug = '' } = useParams();
  const result = useOpportunityData(() => getOpportunityBySlug(slug), slug);
  usePageTitle(result.status === 'ready' && result.data ? result.data.title : 'Opportunity');

  return (
    <div className="container prose">
      <p>
        <Link to="/opportunities">← All opportunities</Link>
      </p>
      {result.status === 'loading' && <Loading label="Loading opportunity…" />}
      {result.status === 'error' && <LoadError message={result.message} onRetry={result.reload} />}
      {result.status === 'ready' && !result.data && (
        <>
          <h1>Opportunity not found</h1>
          <p>
            This opportunity does not exist or is no longer listed. It may have been removed after
            review.
          </p>
          <p>
            <Link className="button button--primary" to="/opportunities">
              Browse opportunities
            </Link>
          </p>
        </>
      )}
      {result.status === 'ready' && result.data && <Detail opportunity={result.data} />}
    </div>
  );
}

function Detail({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const closed = deadlineState(o.closes_at).kind === 'closed' || o.is_closed;
  const applicationUrl = safeExternalUrl(o.application_url);
  const sourceUrl = safeExternalUrl(o.source_url);
  const providerUrl = safeExternalUrl(o.provider_url);
  const verification = verificationInfo[o.verification_status];

  const facts: [string, string | null][] = [
    ['Type', opportunityTypeLabels[o.opportunity_type]],
    ['Provider', o.provider_name],
    ['Province', o.province ? provinceLabels[o.province] : null],
    ['Location', o.location_text],
    ['Format', o.delivery_mode ? deliveryModeLabels[o.delivery_mode] : null],
    [
      'Minimum qualification',
      o.min_qualification ? qualificationLabels[o.min_qualification] : null,
    ],
    [
      'Age',
      o.age_min !== null || o.age_max !== null
        ? `${o.age_min ?? '–'} to ${o.age_max ?? '–'} (as stated by the provider)`
        : null,
    ],
    ['Applications open', o.opens_at ? formatDate(o.opens_at) : null],
    ['Duration', o.duration_text],
  ];

  return (
    <article>
      <header className={styles.detailHeader}>
        <h1>{o.title}</h1>
        <p className="lead">{o.summary}</p>
        <div className={styles.cardFooter}>
          <DeadlineBadge closesAt={o.closes_at} />
          <VerificationBadge status={o.verification_status} />
        </div>
      </header>

      {closed && (
        <div className={styles.closedBanner} role="note">
          This opportunity has closed. It is shown for reference only — applications are no longer
          accepted.
        </div>
      )}

      <dl className={styles.facts}>
        {facts
          .filter((fact): fact is [string, string] => Boolean(fact[1]))
          .map(([term, value]) => (
            <div key={term} style={{ display: 'contents' }}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>

      {!closed && (
        <div className={styles.actions}>
          {applicationUrl ? (
            <a
              className="button button--primary"
              href={applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply on the provider’s website
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          ) : null}
          <SaveControl opportunityId={o.id} />
        </div>
      )}
      {!closed && !applicationUrl && o.application_instructions && (
        <section className={styles.section} aria-labelledby="how-to-apply">
          <h2 id="how-to-apply">How to apply</h2>
          <p className={styles.prewrap}>{o.application_instructions}</p>
        </section>
      )}

      <section className={styles.section} aria-labelledby="about-heading">
        <h2 id="about-heading">About this opportunity</h2>
        <p className={styles.prewrap}>{o.description}</p>
      </section>

      {o.eligibility && (
        <section className={styles.section} aria-labelledby="eligibility-heading">
          <h2 id="eligibility-heading">Who can apply</h2>
          <p className={styles.prewrap}>{o.eligibility}</p>
        </section>
      )}
      {o.required_documents && (
        <section className={styles.section} aria-labelledby="documents-heading">
          <h2 id="documents-heading">Documents you will need</h2>
          <p className={styles.prewrap}>{o.required_documents}</p>
        </section>
      )}
      {o.required_skills && (
        <section className={styles.section} aria-labelledby="skills-heading">
          <h2 id="skills-heading">Skills</h2>
          <p className={styles.prewrap}>{o.required_skills}</p>
        </section>
      )}
      {o.financial_details && (
        <section className={styles.section} aria-labelledby="money-heading">
          <h2 id="money-heading">Funding and costs</h2>
          <p className={styles.prewrap}>{o.financial_details}</p>
        </section>
      )}
      {o.contact_info && (
        <section className={styles.section} aria-labelledby="contact-heading">
          <h2 id="contact-heading">Provider contact</h2>
          <p className={styles.prewrap}>{o.contact_info}</p>
        </section>
      )}

      <section className={styles.section} aria-labelledby="source-heading">
        <h2 id="source-heading">Source and checks</h2>
        <p>
          <strong>{verification.label}:</strong> {verification.description}
        </p>
        <ul>
          {sourceUrl && (
            <li>
              Source: <ExternalLink href={sourceUrl}>official information</ExternalLink>
            </li>
          )}
          {providerUrl && (
            <li>
              Provider website: <ExternalLink href={providerUrl}>{o.provider_name}</ExternalLink>
            </li>
          )}
          {o.last_checked_at && <li>Last checked: {formatTimestamp(o.last_checked_at)}</li>}
          {o.published_at && <li>Listed: {formatTimestamp(o.published_at)}</li>}
        </ul>
        <p>
          RISE NETWORK does not offer or decide on this opportunity and cannot guarantee selection.
          Never pay anyone who promises you a place. Confirm details with the provider before you
          apply.
        </p>
      </section>

      <ReportSection opportunityId={o.id} />
    </article>
  );
}

function SaveControl({ opportunityId }: { opportunityId: string }) {
  const { status } = useAuth();
  const location = useLocation();
  const saved = useOpportunityData(
    () => (status === 'signed_in' ? isSaved(opportunityId) : Promise.resolve(false)),
    `${opportunityId}:${status}`,
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'unavailable' || status === 'loading') return null;
  if (status === 'signed_out') {
    return (
      <Link
        className="button button--secondary"
        to={`/sign-in?next=${encodeURIComponent(location.pathname)}`}
      >
        Sign in to save
      </Link>
    );
  }
  if (saved.status !== 'ready') return null;
  const isCurrentlySaved = override ?? saved.data;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (isCurrentlySaved) await unsaveOpportunity(opportunityId);
      else await saveOpportunity(opportunityId);
      setOverride(!isCurrentlySaved);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="button button--secondary"
        aria-pressed={isCurrentlySaved}
        disabled={busy}
        onClick={toggle}
      >
        {isCurrentlySaved ? 'Saved — remove' : 'Save'}
      </button>
      {isCurrentlySaved && <Link to="/saved">View saved opportunities</Link>}
      {error && <FormStatus kind="error">{error}</FormStatus>}
    </>
  );
}

function ReportSection({ opportunityId }: { opportunityId: string }) {
  const { status } = useAuth();
  const location = useLocation();
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (status === 'unavailable') return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get('reason') ?? '') as ReportReason | '';
    const details = String(form.get('details') ?? '').trim();
    if (!reason || !reportReasons.includes(reason)) {
      setReasonError('Choose what is wrong with this listing.');
      return;
    }
    setReasonError(undefined);
    setState('sending');
    try {
      await reportOpportunity(opportunityId, reason, details.slice(0, 1000));
      setState('sent');
    } catch (e) {
      setMessage(errorMessage(e));
      setState('error');
    }
  }

  return (
    <section className={styles.section} aria-labelledby="report-heading">
      <h2 id="report-heading">Report a problem</h2>
      {status !== 'signed_in' ? (
        <p>
          If this listing looks suspicious or wrong,{' '}
          <Link to={`/sign-in?next=${encodeURIComponent(location.pathname)}`}>sign in</Link> to
          report it.
        </p>
      ) : state === 'sent' ? (
        <FormStatus kind="success">
          <p>Thank you. A moderator will review your report.</p>
        </FormStatus>
      ) : (
        <details>
          <summary>Report this listing</summary>
          <form className={formStyles.form} onSubmit={onSubmit} aria-label="Report this listing">
            {state === 'error' && <FormStatus kind="error">{message}</FormStatus>}
            <SelectField
              label="What is wrong?"
              name="reason"
              required
              placeholder="Choose a reason"
              error={reasonError}
              options={reportReasons.map((value) => ({
                value,
                label: reportReasonLabels[value],
              }))}
            />
            <TextField
              label="Details"
              name="details"
              maxLength={1000}
              hint="Do not include personal information."
            />
            <div className={formStyles.actions}>
              <button
                type="submit"
                className="button button--primary"
                disabled={state === 'sending'}
              >
                {state === 'sending' ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </form>
        </details>
      )}
    </section>
  );
}
