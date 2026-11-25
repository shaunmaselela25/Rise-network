import { useNavigate } from 'react-router';
import { Notice } from '../../components/Notice';
import { usePageTitle } from '../../lib/usePageTitle';
import { createSubmission } from './api';
import { SubmissionForm } from './SubmissionForm';

export function SubmitOpportunityPage() {
  usePageTitle('Submit an opportunity');
  const navigate = useNavigate();

  return (
    <div className="container prose">
      <h1>Submit an opportunity</h1>
      <p className="lead">
        Share a legitimate opportunity with other young people. A moderator checks every submission
        against its official source before it is published.
      </p>
      <Notice title="Before you submit">
        <ul>
          <li>Only submit opportunities from real, identifiable organisations.</li>
          <li>Copy details exactly from the official source — do not guess or add anything.</li>
          <li>
            If applicants must pay anything, say so clearly under “Funding and costs”. Reviewers
            confirm any fee with the provider.
          </li>
          <li>You can submit up to 10 opportunities a day.</li>
        </ul>
      </Notice>
      <SubmissionForm
        initialValues={{}}
        allowDraft
        submitLabel="Submit for review"
        onSave={async (content, intent) => {
          await createSubmission(content, intent === 'submit');
          navigate(`/my-submissions?saved=${intent}`, { replace: true });
        }}
      />
    </div>
  );
}
