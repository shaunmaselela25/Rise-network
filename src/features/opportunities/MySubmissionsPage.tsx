import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { FormStatus } from '../../components/form/FormStatus';
import { formatTimestamp } from '../../lib/dates';
import { usePageTitle } from '../../lib/usePageTitle';
import { useAuth } from '../auth/authContext';
import { deleteDraft, listMySubmissions, submitForReview, type OpportunityRow } from './api';
import { LoadError, Loading } from './components';
import { statusLabels } from './labels';
import styles from './opportunities.module.css';
import { errorMessage, useOpportunityData } from './useOpportunityData';

const EDITABLE = new Set(['draft', 'changes_requested']);

export function MySubmissionsPage() {
  usePageTitle('My submissions');
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const [searchParams] = useSearchParams();
  const saved = searchParams.get('saved');
  const result = useOpportunityData(() => listMySubmissions(userId), userId);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setActionError(null);
    try {
      await action();
      result.reload();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  }

  return (
    <div className="container">
      <h1>My submissions</h1>
      {saved === 'submit' && (
        <FormStatus kind="success">
          <p>Thank you. Your opportunity has been submitted and is waiting for review.</p>
        </FormStatus>
      )}
      {saved === 'draft' && (
        <FormStatus kind="success">
          <p>Your draft has been saved. Submit it for review when it is ready.</p>
        </FormStatus>
      )}
      {actionError && <FormStatus kind="error">{actionError}</FormStatus>}
      <p>
        <Link className="button button--primary" to="/submit">
          Submit an opportunity
        </Link>
      </p>

      {result.status === 'loading' && <Loading label="Loading your submissions…" />}
      {result.status === 'error' && <LoadError message={result.message} onRetry={result.reload} />}
      {result.status === 'ready' && result.data.length === 0 && (
        <div className={styles.empty}>
          <p>You have not submitted any opportunities yet.</p>
        </div>
      )}
      {result.status === 'ready' && result.data.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="visually-hidden">Your submitted opportunities</caption>
            <thead>
              <tr>
                <th scope="col">Opportunity</th>
                <th scope="col">Status</th>
                <th scope="col">Last updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <SubmissionRow key={row.id} row={row} run={run} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  row,
  run,
}: {
  row: OpportunityRow;
  run: (action: () => Promise<void>) => Promise<void>;
}) {
  return (
    <tr>
      <td>
        {row.status === 'published' ? (
          <Link to={`/opportunities/${row.slug}`}>{row.title}</Link>
        ) : (
          row.title
        )}
      </td>
      <td>{statusLabels[row.status]}</td>
      <td>{formatTimestamp(row.updated_at)}</td>
      <td>
        <div className={styles.cardActions} style={{ marginTop: 0 }}>
          {EDITABLE.has(row.status) && (
            <>
              <Link to={`/my-submissions/${row.id}`}>
                Edit<span className="visually-hidden"> {row.title}</span>
              </Link>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => run(() => submitForReview(row.id))}
              >
                Submit for review<span className="visually-hidden">: {row.title}</span>
              </button>
            </>
          )}
          {row.status === 'draft' && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                if (window.confirm(`Delete the draft “${row.title}”? This cannot be undone.`)) {
                  void run(() => deleteDraft(row.id));
                }
              }}
            >
              Delete draft<span className="visually-hidden">: {row.title}</span>
            </button>
          )}
          {!EDITABLE.has(row.status) && row.status !== 'published' && (
            <Link to={`/my-submissions/${row.id}`}>
              View<span className="visually-hidden"> {row.title}</span>
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}
