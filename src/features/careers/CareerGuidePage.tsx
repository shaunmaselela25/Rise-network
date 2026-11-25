import { Link, useParams } from 'react-router';
import { LoadError, Loading } from '../../components/AsyncStates';
import styles from '../../components/Listing.module.css';
import { formatTimestamp } from '../../lib/dates';
import { useData } from '../../lib/errors';
import { usePageTitle } from '../../lib/usePageTitle';
import { getPublishedCareerBySlug } from './api';
import { topicLabels } from './labels';

export function CareerGuidePage() {
  const { slug = '' } = useParams();
  const result = useData(() => getPublishedCareerBySlug(slug), slug);
  usePageTitle(result.status === 'ready' && result.data ? result.data.title : 'Career guide');

  return (
    <div className="container prose">
      <p>
        <Link to="/careers">← All career guides</Link>
      </p>
      {result.status === 'loading' && <Loading label="Loading guide…" />}
      {result.status === 'error' && <LoadError message={result.message} onRetry={result.reload} />}
      {result.status === 'ready' && !result.data && (
        <>
          <h1>Guide not found</h1>
          <p>This guide does not exist or is no longer published.</p>
        </>
      )}
      {result.status === 'ready' && result.data && (
        <article>
          <p className={styles.cardMeta}>{topicLabels[result.data.topic]}</p>
          <h1>{result.data.title}</h1>
          <p className="lead">{result.data.summary}</p>
          {/* Plain text only: never rendered as HTML. */}
          {result.data.body && <div className={styles.prewrap}>{result.data.body}</div>}
          {result.data.external_url && /^https:\/\/[^\s]+$/.test(result.data.external_url) && (
            <p>
              <a href={result.data.external_url} target="_blank" rel="noopener noreferrer">
                Read the full guide<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </p>
          )}
          {result.data.last_reviewed_at && (
            <p className={styles.cardMeta}>
              Last reviewed {formatTimestamp(result.data.last_reviewed_at)}
            </p>
          )}
        </article>
      )}
    </div>
  );
}
