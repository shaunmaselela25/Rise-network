import { type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckboxField, SelectField, TextField } from '../../components/form/Field';
import { Notice } from '../../components/Notice';
import { isBackendConfigured } from '../../lib/backendFlag';
import { provinceLabels, qualificationLabels, type Province } from '../../lib/reference';
import { usePageTitle } from '../../lib/usePageTitle';
import { useAuth } from '../auth/authContext';
import { listCategories, listOpportunities } from './api';
import { LoadError, Loading, OpportunityCard, Pagination } from './components';
import {
  PAGE_SIZE,
  defaultFilters,
  filtersToParams,
  hasActiveFilters,
  parseFilters,
  qualificationOrder,
  type OpportunityFilters,
} from './filters';
import { opportunityTypeLabels, opportunityTypes } from './labels';
import styles from './opportunities.module.css';
import { useOpportunityData } from './useOpportunityData';

export function OpportunitiesPage() {
  usePageTitle('Opportunities');
  if (!isBackendConfigured()) return <DirectoryUnavailable />;
  return <Directory />;
}

function DirectoryUnavailable() {
  return (
    <div className="container prose">
      <h1>Opportunities</h1>
      <Notice title="Not available yet">
        <p>
          The opportunity directory is not available on this version of RISE NETWORK. Nothing on
          this page should be taken as a real opportunity.
        </p>
      </Notice>
      <p>
        <Link to="/about">Learn more about RISE NETWORK</Link>
      </p>
    </div>
  );
}

function Directory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const filterKey = filtersToParams(filters).toString();
  const { status: authStatus } = useAuth();

  const categories = useOpportunityData(listCategories, 'categories');
  const results = useOpportunityData(() => listOpportunities(filters), filterKey);
  const categoryLabels = new Map(
    categories.status === 'ready' ? categories.data.map((c) => [c.code, c.label]) : [],
  );

  function apply(next: OpportunityFilters) {
    setSearchParams(filtersToParams({ ...next, page: 1 }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string' && value) params.set(key, value);
    }
    apply(parseFilters(params));
  }

  const totalPages =
    results.status === 'ready' ? Math.max(1, Math.ceil(results.data.total / PAGE_SIZE)) : 1;

  return (
    <div className="container">
      <h1>Opportunities</h1>
      <p className="lead">
        Bursaries, internships, learnerships, training and more — reviewed before they are listed.
        Always apply through the provider’s official page.
      </p>
      {authStatus !== 'unavailable' && (
        <p>
          Know of an opportunity?{' '}
          <Link to={authStatus === 'signed_in' ? '/submit' : '/sign-in?next=%2Fsubmit'}>
            Submit it for review
          </Link>
          .
        </p>
      )}

      {/* key forces the uncontrolled form to reset when the URL changes (e.g. "Clear"). */}
      <form
        key={filterKey}
        onSubmit={onSubmit}
        role="search"
        aria-label="Search and filter opportunities"
      >
        <div className={styles.searchRow}>
          <TextField
            label="Search"
            name="q"
            type="search"
            defaultValue={filters.q}
            maxLength={100}
            showOptional={false}
            hint="Try a field of study, a provider or a word like “bursary”."
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
                label="Type"
                name="type"
                showOptional={false}
                defaultValue={filters.type}
                placeholder="All types"
                options={opportunityTypes.map((value) => ({
                  value,
                  label: opportunityTypeLabels[value],
                }))}
              />
              <SelectField
                // Remount only this select when its options arrive, so its defaultValue
                // applies without resetting anything else the user has typed.
                key={`category-${categories.status}`}
                label="Field"
                name="category"
                showOptional={false}
                defaultValue={filters.category}
                placeholder="All fields"
                options={
                  categories.status === 'ready'
                    ? categories.data.map((c) => ({ value: c.code, label: c.label }))
                    : []
                }
              />
              <SelectField
                label="Province"
                name="province"
                showOptional={false}
                defaultValue={filters.province}
                placeholder="All provinces"
                options={(Object.keys(provinceLabels) as Province[]).map((value) => ({
                  value,
                  label: provinceLabels[value],
                }))}
              />
              <SelectField
                label="My highest qualification"
                name="qualification"
                showOptional={false}
                defaultValue={filters.qualification}
                placeholder="Show all"
                hint="Shows listings you meet the minimum qualification for, and listings with no stated minimum."
                options={qualificationOrder.map((value) => ({
                  value,
                  label: qualificationLabels[value],
                }))}
              />
              <SelectField
                label="Closing date"
                name="closing"
                showOptional={false}
                defaultValue={filters.closing}
                options={[
                  { value: 'any', label: 'Any time' },
                  { value: '7', label: 'Closing in the next 7 days' },
                  { value: '30', label: 'Closing in the next 30 days' },
                ]}
              />
              <SelectField
                label="Sort by"
                name="sort"
                showOptional={false}
                defaultValue={filters.sort}
                options={[
                  { value: 'closing', label: 'Closing soonest' },
                  { value: 'newest', label: 'Newest first' },
                ]}
              />
              <CheckboxField
                name="closed"
                value="1"
                defaultChecked={filters.includeClosed}
                label="Include closed opportunities"
              />
              <div className={styles.actions} style={{ marginBlock: 0 }}>
                <button type="submit" className="button button--primary">
                  Apply filters
                </button>
                {hasActiveFilters(filters) && (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setSearchParams(filtersToParams(defaultFilters))}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </details>

          <section aria-labelledby="results-heading">
            <h2 id="results-heading" className="visually-hidden">
              Results
            </h2>
            <div aria-live="polite" aria-atomic="true">
              {results.status === 'loading' && <Loading label="Loading opportunities…" />}
              {results.status === 'ready' && (
                <div className={styles.resultsHeader}>
                  <p className={styles.resultsCount}>
                    {results.data.total === 1
                      ? '1 opportunity found'
                      : `${results.data.total} opportunities found`}
                  </p>
                </div>
              )}
            </div>
            {results.status === 'error' && (
              <LoadError message={results.message} onRetry={results.reload} />
            )}
            {results.status === 'ready' && results.data.items.length === 0 && (
              <div className={styles.empty}>
                <p>
                  <strong>No opportunities match your search.</strong>
                </p>
                <p>Try fewer filters or different words.</p>
                {hasActiveFilters(filters) && (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setSearchParams(filtersToParams(defaultFilters))}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
            {results.status === 'ready' && results.data.items.length > 0 && (
              <>
                <ul className={styles.list}>
                  {results.data.items.map((item) => (
                    <li key={item.id}>
                      <OpportunityCard
                        opportunity={item}
                        categoryLabel={categoryLabels.get(item.category_code)}
                      />
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  hrefForPage={(page) => `?${filtersToParams({ ...filters, page }).toString()}`}
                />
              </>
            )}
          </section>
        </div>
      </form>
    </div>
  );
}
