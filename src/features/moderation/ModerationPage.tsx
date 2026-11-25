import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { SelectField, TextAreaField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { formatTimestamp } from '../../lib/dates';
import { usePageTitle } from '../../lib/usePageTitle';
import {
  listForModeration,
  listOpenReports,
  resolveReport,
  type OpportunityRow,
  type ReportWithOpportunity,
} from '../opportunities/api';
import { DeadlineBadge, LoadError, Loading, VerificationBadge } from '../opportunities/components';
import { reportReasonLabels } from '../opportunities/labels';
import styles from '../opportunities/opportunities.module.css';
import { errorMessage, useOpportunityData } from '../opportunities/useOpportunityData';
import { isStale } from './freshness';

type Tab = 'queue' | 'published' | 'reports';

export function ModerationPage() {
  usePageTitle('Moderation');
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = tabParam === 'published' || tabParam === 'reports' ? tabParam : 'queue';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'queue', label: 'Review queue' },
    { id: 'published', label: 'Published' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="container">
      <h1>Moderation</h1>
      <nav aria-label="Moderation sections" className={styles.actions}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`button ${t.id === tab ? 'button--primary' : 'button--secondary'}`}
            aria-current={t.id === tab ? 'page' : undefined}
            onClick={() => setSearchParams(t.id === 'queue' ? {} : { tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === 'queue' && <OpportunityList status="pending_review" />}
      {tab === 'published' && <OpportunityList status="published" />}
      {tab === 'reports' && <ReportsList />}
    </div>
  );
}

function OpportunityList({ status }: { status: 'pending_review' | 'published' }) {
  const result = useOpportunityData(() => listForModeration(status), status);
  if (result.status === 'loading') return <Loading label="Loading…" />;
  if (result.status === 'error') {
    return <LoadError message={result.message} onRetry={result.reload} />;
  }
  if (result.data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>
          {status === 'pending_review'
            ? 'Nothing is waiting for review.'
            : 'Nothing is published yet.'}
        </p>
      </div>
    );
  }
  const staleCount = status === 'published' ? result.data.filter((o) => isStale(o)).length : 0;
  return (
    <>
      {status === 'published' && staleCount > 0 && (
        <FormStatus kind="error">
          <p>
            {staleCount} published {staleCount === 1 ? 'listing has' : 'listings have'} not been
            checked in the last 30 days and should be rechecked.
          </p>
        </FormStatus>
      )}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">
            {status === 'pending_review' ? 'Submissions waiting for review' : 'Published listings'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Opportunity</th>
              <th scope="col">Provider</th>
              <th scope="col">Closing</th>
              <th scope="col">Verification</th>
              <th scope="col">{status === 'pending_review' ? 'Submitted' : 'Last checked'}</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((o: OpportunityRow) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/moderation/${o.id}`}>{o.title}</Link>
                </td>
                <td>{o.provider_name}</td>
                <td>
                  <DeadlineBadge closesAt={o.closes_at} />
                </td>
                <td>
                  <VerificationBadge status={o.verification_status} />
                  {status === 'published' && isStale(o) && <strong> Needs recheck</strong>}
                </td>
                <td>
                  {status === 'pending_review'
                    ? formatTimestamp(o.created_at)
                    : o.last_checked_at
                      ? formatTimestamp(o.last_checked_at)
                      : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportsList() {
  const result = useOpportunityData(listOpenReports, 'reports');
  if (result.status === 'loading') return <Loading label="Loading reports…" />;
  if (result.status === 'error') {
    return <LoadError message={result.message} onRetry={result.reload} />;
  }
  if (result.data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>There are no open reports.</p>
      </div>
    );
  }
  return (
    <ul className={styles.list} style={{ gridTemplateColumns: '1fr' }}>
      {result.data.map((report) => (
        <li key={report.id}>
          <ReportCard report={report} onResolved={result.reload} />
        </li>
      ))}
    </ul>
  );
}

function ReportCard({
  report,
  onResolved,
}: {
  report: ReportWithOpportunity;
  onResolved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const outcome = form.get('outcome');
    if (outcome !== 'dismissed' && outcome !== 'actioned') {
      setError('Choose an outcome.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resolveReport(report.id, outcome, String(form.get('note') ?? '').trim());
      onResolved();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <article
      className={styles.card}
      aria-label={`Report on ${report.opportunities?.title ?? 'a listing'}`}
    >
      <p className={styles.cardMeta}>Reported {formatTimestamp(report.created_at)}</p>
      <h2 className={styles.cardTitle}>
        {report.opportunities ? (
          <Link to={`/moderation/${report.opportunities.id}`}>{report.opportunities.title}</Link>
        ) : (
          'Listing unavailable'
        )}
      </h2>
      <p>
        <strong>{reportReasonLabels[report.reason]}</strong>
      </p>
      {report.details && <p className={styles.prewrap}>{report.details}</p>}
      <form className={formStyles.form} onSubmit={onSubmit} aria-label="Resolve report">
        {error && <FormStatus kind="error">{error}</FormStatus>}
        <SelectField
          label="Outcome"
          name="outcome"
          required
          placeholder="Choose an outcome"
          options={[
            { value: 'actioned', label: 'Actioned — listing corrected, unpublished or marked' },
            { value: 'dismissed', label: 'Dismissed — no problem found' },
          ]}
        />
        <TextAreaField label="Note" name="note" rows={2} maxLength={2000} />
        <div className={formStyles.actions}>
          <button type="submit" className="button button--primary" disabled={busy}>
            Resolve report
          </button>
        </div>
      </form>
    </article>
  );
}
