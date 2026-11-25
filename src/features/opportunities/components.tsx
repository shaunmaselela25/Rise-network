import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { deadlineState, deadlineText } from '../../lib/dates';
import { provinceLabels } from '../../lib/reference';
import type { OpportunityCardData } from './api';
import {
  deliveryModeLabels,
  opportunityTypeLabels,
  verificationInfo,
  type VerificationStatus,
} from './labels';
import styles from './opportunities.module.css';

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const info = verificationInfo[status];
  return (
    <span className={`${styles.badge} ${styles[`badge_${info.tone}`]}`} title={info.description}>
      {info.label}
    </span>
  );
}

export function DeadlineBadge({ closesAt }: { closesAt: string | null }) {
  const state = deadlineState(closesAt);
  const tone =
    state.kind === 'closed'
      ? styles.deadline_closed
      : state.kind === 'closes_today' || (state.kind === 'open' && state.daysLeft <= 7)
        ? styles.deadline_soon
        : '';
  return <span className={`${styles.deadline} ${tone}`}>{deadlineText(closesAt)}</span>;
}

export function OpportunityCard({
  opportunity,
  categoryLabel,
  actions,
}: {
  opportunity: OpportunityCardData;
  categoryLabel?: string | undefined;
  actions?: ReactNode;
}) {
  const location = opportunity.province
    ? provinceLabels[opportunity.province]
    : opportunity.delivery_mode
      ? deliveryModeLabels[opportunity.delivery_mode]
      : null;
  return (
    <article className={styles.card} aria-labelledby={`opp-${opportunity.id}`}>
      <p className={styles.cardMeta}>
        {opportunityTypeLabels[opportunity.opportunity_type]}
        {categoryLabel && <> · {categoryLabel}</>}
      </p>
      <h3 id={`opp-${opportunity.id}`} className={styles.cardTitle}>
        <Link to={`/opportunities/${opportunity.slug}`}>{opportunity.title}</Link>
      </h3>
      <p className={styles.cardProvider}>{opportunity.provider_name}</p>
      <p className={styles.cardSummary}>{opportunity.summary}</p>
      <div className={styles.cardFooter}>
        <DeadlineBadge closesAt={opportunity.closes_at} />
        {location && <span>{location}</span>}
        <VerificationBadge status={opportunity.verification_status} />
      </div>
      {actions && <div className={styles.cardActions}>{actions}</div>}
    </article>
  );
}

export { LoadError, Loading } from '../../components/AsyncStates';

export function Pagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      {page > 1 ? (
        <Link to={hrefForPage(page - 1)} className="button button--secondary">
          Previous<span className="visually-hidden"> page</span>
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link to={hrefForPage(page + 1)} className="button button--secondary">
          Next<span className="visually-hidden"> page</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
