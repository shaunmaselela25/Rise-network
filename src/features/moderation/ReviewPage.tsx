import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { SelectField, TextAreaField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { formatDate, formatTimestamp } from '../../lib/dates';
import { provinceLabels, qualificationLabels } from '../../lib/reference';
import { usePageTitle } from '../../lib/usePageTitle';
import {
  getOpportunityForEditing,
  listReviews,
  reviewOpportunity,
  type OpportunityRow,
  type ReviewAction,
  type VerificationStatus,
} from '../opportunities/api';
import { DeadlineBadge, LoadError, Loading, VerificationBadge } from '../opportunities/components';
import {
  deliveryModeLabels,
  opportunityTypeLabels,
  statusLabels,
  verificationInfo,
} from '../opportunities/labels';
import styles from '../opportunities/opportunities.module.css';
import { errorMessage, useOpportunityData } from '../opportunities/useOpportunityData';
import { isStale } from './freshness';

const verificationOptions: VerificationStatus[] = [
  'source_checked',
  'provider_confirmed',
  'needs_recheck',
  'disputed',
  'unverified',
];

const actionsByStatus: Record<
  string,
  { action: ReviewAction; label: string; primary?: boolean }[]
> = {
  pending_review: [
    { action: 'publish', label: 'Publish', primary: true },
    { action: 'request_changes', label: 'Request changes' },
    { action: 'reject', label: 'Reject' },
    { action: 'archive', label: 'Archive' },
  ],
  published: [
    { action: 'set_verification', label: 'Update verification', primary: true },
    { action: 'unpublish', label: 'Unpublish for re-review' },
    { action: 'archive', label: 'Archive' },
  ],
  changes_requested: [{ action: 'archive', label: 'Archive' }],
  rejected: [{ action: 'archive', label: 'Archive' }],
};

const actionMessages: Record<ReviewAction, string> = {
  publish: 'Published. The listing is now public.',
  request_changes: 'Changes requested. The submitter can now edit and resubmit.',
  reject: 'Rejected. The reason has been recorded.',
  archive: 'Archived.',
  unpublish: 'Unpublished. The listing is back in the review queue.',
  set_verification: 'Verification status updated.',
};

export function ReviewPage() {
  usePageTitle('Review opportunity');
  const { id = '' } = useParams();
  const data = useOpportunityData(
    () => Promise.all([getOpportunityForEditing(id), listReviews(id)]),
    id,
  );
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="container prose">
      <p>
        <Link to="/moderation">← Moderation</Link>
      </p>
      <div aria-live="polite">{message && <FormStatus kind="success">{message}</FormStatus>}</div>
      {data.status === 'loading' && <Loading label="Loading…" />}
      {data.status === 'error' && <LoadError message={data.message} onRetry={data.reload} />}
      {data.status === 'ready' && !data.data[0] && <h1>Opportunity not found</h1>}
      {data.status === 'ready' && data.data[0] && (
        <>
          <ReviewDetails opportunity={data.data[0]} />
          <ReviewActions
            opportunity={data.data[0]}
            onDone={(text) => {
              setMessage(text);
              data.reload();
            }}
          />
          {data.data[1].length > 0 && (
            <section className={styles.section} aria-labelledby="history-heading">
              <h2 id="history-heading">Review history</h2>
              <ul>
                {data.data[1].map((review) => (
                  <li key={review.id}>
                    {formatTimestamp(review.created_at)} — {statusLabels[review.from_status]} →{' '}
                    {statusLabels[review.to_status]} (
                    {verificationInfo[review.verification_status].label})
                    {review.note && <>: “{review.note}”</>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ReviewDetails({ opportunity: o }: { opportunity: OpportunityRow }) {
  const rows: [string, string | null][] = [
    ['Status', statusLabels[o.status]],
    ['Type', opportunityTypeLabels[o.opportunity_type]],
    ['Field', o.category_code],
    ['Provider', o.provider_name],
    ['Provider website', o.provider_url],
    ['Source', o.source_url],
    ['Application link', o.application_url],
    ['Application instructions', o.application_instructions],
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
        ? `${o.age_min ?? '–'} to ${o.age_max ?? '–'}`
        : null,
    ],
    ['Opens', o.opens_at ? formatDate(o.opens_at) : null],
    ['Duration', o.duration_text],
    ['Eligibility', o.eligibility],
    ['Documents', o.required_documents],
    ['Skills', o.required_skills],
    ['Funding and costs', o.financial_details],
    ['Contact', o.contact_info],
    ['Verification notes', o.verification_notes],
    ['Last checked', o.last_checked_at ? formatTimestamp(o.last_checked_at) : 'Never'],
    ['Submitted', formatTimestamp(o.created_at)],
  ];
  return (
    <>
      <h1>{o.title}</h1>
      <p className="lead">{o.summary}</p>
      <div className={styles.cardFooter}>
        <DeadlineBadge closesAt={o.closes_at} />
        <VerificationBadge status={o.verification_status} />
        {o.status === 'published' && isStale(o) && <strong>Needs recheck (D-06)</strong>}
      </div>
      <h2>Description</h2>
      <p className={styles.prewrap}>{o.description}</p>
      <dl className={styles.facts}>
        {rows
          .filter((row): row is [string, string] => Boolean(row[1]))
          .map(([term, value]) => (
            <div key={term} style={{ display: 'contents' }}>
              <dt>{term}</dt>
              <dd className={styles.prewrap}>{value}</dd>
            </div>
          ))}
      </dl>
      {o.status === 'published' && (
        <p>
          <Link to={`/opportunities/${o.slug}`}>View public page</Link>
        </p>
      )}
    </>
  );
}

function ReviewActions({
  opportunity: o,
  onDone,
}: {
  opportunity: OpportunityRow;
  onDone: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const actions = actionsByStatus[o.status] ?? [];
  if (actions.length === 0) return <p>No moderation actions are available for this item.</p>;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.value as ReviewAction | undefined;
    if (!action) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const verification = (String(form.get('verification') ?? '') ||
      null) as VerificationStatus | null;
    const note = String(form.get('note') ?? '').trim();
    if (
      action === 'archive' &&
      !window.confirm('Archive this listing? It will no longer be public.')
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reviewOpportunity(o.id, action, note, verification);
      formElement.reset();
      onDone(actionMessages[action]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="decision-heading">
      <h2 id="decision-heading">Decision</h2>
      <details>
        <summary>Review checklist</summary>
        <ol>
          <li>The source is the provider’s official page, not a reposting site.</li>
          <li>The provider is a real, identifiable organisation.</li>
          <li>Eligibility, documents, costs and dates match the source exactly.</li>
          <li>The application link works and leads to the provider or an official portal.</li>
          <li>Any fee to applicants is clearly stated and confirmed with the provider.</li>
          <li>There is no guarantee language.</li>
        </ol>
      </details>
      <form className={formStyles.form} onSubmit={onSubmit} aria-label="Moderation decision">
        {error && <FormStatus kind="error">{error}</FormStatus>}
        <SelectField
          label="Verification status"
          name="verification"
          defaultValue=""
          placeholder={`Keep current (${verificationInfo[o.verification_status].label})`}
          hint="To publish, choose Source checked or Provider confirmed."
          options={verificationOptions.map((value) => ({
            value,
            label: verificationInfo[value].label,
          }))}
        />
        <TextAreaField
          label="Note"
          name="note"
          rows={3}
          maxLength={2000}
          hint="Required for requesting changes, rejecting and unpublishing. Shown to the submitter."
        />
        <div className={formStyles.actions}>
          {actions.map((a) => (
            <button
              key={a.action}
              type="submit"
              name="action"
              value={a.action}
              className={`button ${a.primary ? 'button--primary' : 'button--secondary'}`}
              disabled={busy}
            >
              {a.label}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}
