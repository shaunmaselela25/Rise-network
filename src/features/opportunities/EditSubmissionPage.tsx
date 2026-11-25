import { Link, useNavigate, useParams } from 'react-router';
import { FormStatus } from '../../components/form/FormStatus';
import { formatTimestamp } from '../../lib/dates';
import { usePageTitle } from '../../lib/usePageTitle';
import { getOpportunityForEditing, listReviews, submitForReview, updateSubmission } from './api';
import { LoadError, Loading } from './components';
import { statusLabels } from './labels';
import { SubmissionForm } from './SubmissionForm';
import { toFormValues } from './submissionSchema';
import { useOpportunityData } from './useOpportunityData';

export function EditSubmissionPage() {
  usePageTitle('Edit submission');
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const data = useOpportunityData(
    () => Promise.all([getOpportunityForEditing(id), listReviews(id)]),
    id,
  );

  if (data.status === 'loading') {
    return (
      <div className="container">
        <Loading label="Loading submission…" />
      </div>
    );
  }
  if (data.status === 'error') {
    return (
      <div className="container">
        <LoadError message={data.message} onRetry={data.reload} />
      </div>
    );
  }

  const [row, reviews] = data.data;
  if (!row) {
    return (
      <div className="container prose">
        <h1>Submission not found</h1>
        <p>
          <Link to="/my-submissions">Back to my submissions</Link>
        </p>
      </div>
    );
  }

  const editable = row.status === 'draft' || row.status === 'changes_requested';
  const latestNote = reviews.find((r) => r.note)?.note;

  return (
    <div className="container prose">
      <p>
        <Link to="/my-submissions">← My submissions</Link>
      </p>
      <h1>{editable ? 'Edit submission' : row.title}</h1>
      <p>
        Status: <strong>{statusLabels[row.status]}</strong>
      </p>
      {row.status === 'changes_requested' && latestNote && (
        <FormStatus kind="error">
          <p>
            <strong>A moderator asked for changes:</strong> {latestNote}
          </p>
        </FormStatus>
      )}
      {row.status === 'rejected' && latestNote && (
        <FormStatus kind="error">
          <p>
            <strong>Reason:</strong> {latestNote}
          </p>
        </FormStatus>
      )}
      {editable ? (
        <SubmissionForm
          initialValues={toFormValues(row)}
          allowDraft={row.status === 'draft'}
          submitLabel={row.status === 'draft' ? 'Submit for review' : 'Save and resubmit'}
          onSave={async (content, intent) => {
            await updateSubmission(row.id, content);
            if (intent === 'submit') await submitForReview(row.id);
            navigate(`/my-submissions?saved=${intent}`, { replace: true });
          }}
        />
      ) : (
        <p>
          This submission can no longer be edited.
          {row.status === 'pending_review' && ' It is waiting for a moderator to review it.'}
        </p>
      )}
      {reviews.length > 0 && (
        <section style={{ marginTop: 'var(--space-6)' }} aria-labelledby="history-heading">
          <h2 id="history-heading">Review history</h2>
          <ul>
            {reviews.map((review) => (
              <li key={review.id}>
                {formatTimestamp(review.created_at)}: {statusLabels[review.from_status]} →{' '}
                {statusLabels[review.to_status]}
                {review.note && <> — “{review.note}”</>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
