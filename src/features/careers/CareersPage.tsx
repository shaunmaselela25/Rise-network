import { Link } from 'react-router';
import { LoadError, Loading } from '../../components/AsyncStates';
import styles from '../../components/Listing.module.css';
import { Notice } from '../../components/Notice';
import { isBackendConfigured } from '../../lib/backendFlag';
import { useData } from '../../lib/errors';
import { usePageTitle } from '../../lib/usePageTitle';
import { listPublishedCareers, type CareerListItem } from './api';
import { topicLabels, topics } from './labels';

export function CareersPage() {
  usePageTitle('Careers');
  if (!isBackendConfigured()) {
    return (
      <div className="container prose">
        <h1>Careers</h1>
        <Notice title="Not available yet">
          <p>Career guidance is not available on this version of RISE NETWORK.</p>
        </Notice>
        <p>
          <Link to="/about">Learn more about RISE NETWORK</Link>
        </p>
      </div>
    );
  }
  return <CareerGuides />;
}

function CareerGuides() {
  const result = useData(listPublishedCareers, 'careers');

  return (
    <div className="container">
      <h1>Careers</h1>
      <p className="lead">
        Practical guidance to help you prepare for work: CVs, interviews, workplace readiness and
        planning your career.
      </p>
      {result.status === 'loading' && <Loading label="Loading career guides…" />}
      {result.status === 'error' && <LoadError message={result.message} onRetry={result.reload} />}
      {result.status === 'ready' && result.data.length === 0 && (
        <div className={styles.empty}>
          <p>No career guides have been published yet. Please check back soon.</p>
        </div>
      )}
      {result.status === 'ready' &&
        topics
          .map((topic) => ({ topic, items: result.data.filter((g) => g.topic === topic) }))
          .filter((group) => group.items.length > 0)
          .map(({ topic, items }) => (
            <section key={topic} className={styles.section} aria-labelledby={`topic-${topic}`}>
              <h2 id={`topic-${topic}`}>{topicLabels[topic]}</h2>
              <ul className={styles.list}>
                {items.map((guide) => (
                  <li key={guide.id}>
                    <GuideCard guide={guide} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
    </div>
  );
}

function GuideCard({ guide }: { guide: CareerListItem }) {
  return (
    <article className={styles.card} aria-labelledby={`guide-${guide.id}`}>
      <h3 id={`guide-${guide.id}`} className={styles.cardTitle}>
        <Link to={`/careers/${guide.slug}`}>{guide.title}</Link>
      </h3>
      <p className={styles.cardSummary}>{guide.summary}</p>
    </article>
  );
}
