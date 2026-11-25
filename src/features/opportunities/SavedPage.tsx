import { useState } from 'react';
import { Link } from 'react-router';
import { FormStatus } from '../../components/form/FormStatus';
import { usePageTitle } from '../../lib/usePageTitle';
import {
  getPublicOpportunitiesByIds,
  listSaved,
  setTrackingStatus,
  unsaveOpportunity,
} from './api';
import { LoadError, Loading, OpportunityCard } from './components';
import { trackingLabels, trackingStatuses, type TrackingStatus } from './labels';
import styles from './opportunities.module.css';
import { errorMessage, useOpportunityData } from './useOpportunityData';

async function loadSaved() {
  const saved = await listSaved();
  const opportunities = await getPublicOpportunitiesByIds(saved.map((s) => s.opportunity_id));
  const byId = new Map(opportunities.map((o) => [o.id, o]));
  return saved.map((entry) => ({ entry, opportunity: byId.get(entry.opportunity_id) ?? null }));
}

export function SavedPage() {
  usePageTitle('Saved opportunities');
  const result = useOpportunityData(loadSaved, 'saved');
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(action: () => Promise<void>, message: string) {
    setActionError(null);
    setNotice(null);
    try {
      await action();
      setNotice(message);
      result.reload();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  }

  return (
    <div className="container">
      <h1>Saved opportunities</h1>
      <p className="lead">Keep track of opportunities you are interested in.</p>
      <div aria-live="polite">{notice && <FormStatus kind="success">{notice}</FormStatus>}</div>
      {actionError && <FormStatus kind="error">{actionError}</FormStatus>}

      {result.status === 'loading' && <Loading label="Loading saved opportunities…" />}
      {result.status === 'error' && <LoadError message={result.message} onRetry={result.reload} />}
      {result.status === 'ready' && result.data.length === 0 && (
        <div className={styles.empty}>
          <p>You have not saved any opportunities yet.</p>
          <Link className="button button--primary" to="/opportunities">
            Browse opportunities
          </Link>
        </div>
      )}
      {result.status === 'ready' && result.data.length > 0 && (
        <ul className={styles.list}>
          {result.data.map(({ entry, opportunity }) => (
            <li key={entry.opportunity_id}>
              {opportunity ? (
                <OpportunityCard
                  opportunity={opportunity}
                  actions={
                    <>
                      <label>
                        <span className="visually-hidden">Progress for {opportunity.title}: </span>
                        <select
                          value={entry.tracking_status}
                          onChange={(event) =>
                            void run(
                              () =>
                                setTrackingStatus(
                                  entry.opportunity_id,
                                  event.target.value as TrackingStatus,
                                ),
                              'Progress updated.',
                            )
                          }
                        >
                          {trackingStatuses.map((status) => (
                            <option key={status} value={status}>
                              {trackingLabels[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() =>
                          void run(
                            () => unsaveOpportunity(entry.opportunity_id),
                            'Removed from saved opportunities.',
                          )
                        }
                      >
                        Remove<span className="visually-hidden"> {opportunity.title}</span>
                      </button>
                    </>
                  }
                />
              ) : (
                <div className={styles.card}>
                  <p>This opportunity is no longer listed.</p>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() =>
                      void run(
                        () => unsaveOpportunity(entry.opportunity_id),
                        'Removed from saved opportunities.',
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
