import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { LoadError, Loading } from '../../components/AsyncStates';
import { SelectField, TextField } from '../../components/form/Field';
import styles from '../../components/Listing.module.css';
import { Notice } from '../../components/Notice';
import { isBackendConfigured } from '../../lib/backendFlag';
import { formatTimestamp } from '../../lib/dates';
import { useData } from '../../lib/errors';
import { usePageTitle } from '../../lib/usePageTitle';
import { listLearningCategories, listPublishedLearning, type PublicLearningResource } from './api';
import {
  LEARNING_PAGE_SIZE,
  defaultLearningFilters,
  learningFiltersToParams,
  parseLearningFilters,
} from './filters';
import { costLabels, costs, formatLabels, formats, levelLabels, levels } from './labels';

export function LearningPage() {
  usePageTitle('Learning');
  if (!isBackendConfigured()) {
    return (
      <div className="container prose">
        <h1>Learning</h1>
        <Notice title="Not available yet">
          <p>The learning directory is not available on this version of RISE NETWORK.</p>
        </Notice>
        <p>
          <Link to="/about">Learn more about RISE NETWORK</Link>
        </p>
      </div>
    );
  }
  return <LearningDirectory />;
}

/** Defence in depth: the database already enforces https-only URLs. */
function safeUrl(url: string): string | null {
  return /^https:\/\/[^\s]+$/.test(url) ? url : null;
}

function LearningDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseLearningFilters(searchParams);
  const key = learningFiltersToParams(filters).toString();
  const categories = useData(listLearningCategories, 'learning-categories');
  const results = useData(() => listPublishedLearning(filters), key);
  const categoryLabels = new Map(
    categories.status === 'ready' ? categories.data.map((c) => [c.code, c.label]) : [],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === 'string' && value) params.set(name, value);
    }
    setSearchParams(learningFiltersToParams({ ...parseLearningFilters(params), page: 1 }));
  }

  const totalPages =
    results.status === 'ready'
      ? Math.max(1, Math.ceil(results.data.total / LEARNING_PAGE_SIZE))
      : 1;

  return (
    <div className="container">
      <h1>Learning</h1>
      <p className="lead">
        Courses and skills-development resources from other organisations. RISE NETWORK does not
        accredit courses or award qualifications — check accreditation with the provider.
      </p>
      <form
        key={key}
        onSubmit={onSubmit}
        role="search"
        aria-label="Search and filter learning resources"
      >
        <div className={styles.searchRow}>
          <TextField
            label="Search by title"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q}
            showOptional={false}
          />
          <button type="submit" className="button button--primary">
            Search
          </button>
        </div>
        <div className={styles.layout}>
          <details className={styles.filters} open>
            <summary>Filters</summary>
            <div className={styles.filterFields}>
              <SelectField
                key={`category-${categories.status}`}
                label="Category"
                name="category"
                showOptional={false}
                defaultValue={filters.category}
                placeholder="All categories"
                options={
                  categories.status === 'ready'
                    ? categories.data.map((c) => ({ value: c.code, label: c.label }))
                    : []
                }
              />
              <SelectField
                label="Level"
                name="level"
                showOptional={false}
                defaultValue={filters.level}
                placeholder="All levels"
                options={levels.map((value) => ({ value, label: levelLabels[value] }))}
              />
              <SelectField
                label="Format"
                name="format"
                showOptional={false}
                defaultValue={filters.format}
                placeholder="All formats"
                options={formats.map((value) => ({ value, label: formatLabels[value] }))}
              />
              <SelectField
                label="Cost"
                name="cost"
                showOptional={false}
                defaultValue={filters.cost}
                placeholder="Any cost"
                options={costs.map((value) => ({ value, label: costLabels[value] }))}
              />
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button type="submit" className="button button--primary">
                  Apply filters
                </button>
                {key && (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setSearchParams(learningFiltersToParams(defaultLearningFilters))}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </details>

          <section aria-labelledby="learning-results">
            <h2 id="learning-results" className="visually-hidden">
              Results
            </h2>
            <div aria-live="polite" aria-atomic="true">
              {results.status === 'loading' && <Loading label="Loading learning resources…" />}
              {results.status === 'ready' && (
                <p className={styles.resultsCount}>
                  {results.data.total === 1
                    ? '1 resource found'
                    : `${results.data.total} resources found`}
                </p>
              )}
            </div>
            {results.status === 'error' && (
              <LoadError message={results.message} onRetry={results.reload} />
            )}
            {results.status === 'ready' && results.data.items.length === 0 && (
              <div className={styles.empty}>
                <p>
                  <strong>No learning resources match.</strong>
                </p>
                <p>Try fewer filters or a different search.</p>
              </div>
            )}
            {results.status === 'ready' && results.data.items.length > 0 && (
              <>
                <ul className={styles.list}>
                  {results.data.items.map((resource) => (
                    <li key={resource.id}>
                      <LearningCard
                        resource={resource}
                        categoryLabel={categoryLabels.get(resource.category_code)}
                      />
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <nav
                    aria-label="Pagination"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 'var(--space-6)',
                    }}
                  >
                    {filters.page > 1 ? (
                      <Link
                        className="button button--secondary"
                        to={`?${learningFiltersToParams({ ...filters, page: filters.page - 1 })}`}
                      >
                        Previous<span className="visually-hidden"> page</span>
                      </Link>
                    ) : (
                      <span />
                    )}
                    <span>
                      Page {filters.page} of {totalPages}
                    </span>
                    {filters.page < totalPages ? (
                      <Link
                        className="button button--secondary"
                        to={`?${learningFiltersToParams({ ...filters, page: filters.page + 1 })}`}
                      >
                        Next<span className="visually-hidden"> page</span>
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </form>
    </div>
  );
}

function LearningCard({
  resource: r,
  categoryLabel,
}: {
  resource: PublicLearningResource;
  categoryLabel?: string | undefined;
}) {
  const url = safeUrl(r.url);
  return (
    <article className={styles.card} aria-labelledby={`lr-${r.id}`}>
      <p className={styles.cardMeta}>
        {categoryLabel ?? r.category_code} · {levelLabels[r.level]}
      </p>
      <h3 id={`lr-${r.id}`} className={styles.cardTitle}>
        {r.title}
      </h3>
      <p style={{ margin: '0 0 var(--space-3)', fontWeight: 600 }}>{r.provider_name}</p>
      <p className={`${styles.cardSummary} ${styles.prewrap}`}>{r.description}</p>
      {r.requirements && (
        <p className={styles.prewrap}>
          <strong>Requirements:</strong> {r.requirements}
        </p>
      )}
      <div className={styles.cardFooter}>
        <span className={styles.badge}>{costLabels[r.cost]}</span>
        <span>{formatLabels[r.format]}</span>
        {r.duration_text && <span>{r.duration_text}</span>}
        {r.last_reviewed_at && <span>Reviewed {formatTimestamp(r.last_reviewed_at)}</span>}
      </div>
      {url && (
        <p style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Go to {r.title} on the provider’s website
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </p>
      )}
    </article>
  );
}
