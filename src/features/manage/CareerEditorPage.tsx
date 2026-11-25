import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { LoadError, Loading } from '../../components/AsyncStates';
import { SelectField, TextAreaField, TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import {
  createCareerResource,
  getCareerResource,
  updateCareerResource,
  type CareerResource,
} from '../careers/api';
import { topicLabels, topics } from '../careers/labels';
import { errorMessage, useData } from '../../lib/errors';
import { usePageTitle } from '../../lib/usePageTitle';
import { validate, type FieldErrors } from '../../lib/validation';
import { resourceStatusLabels, resourceStatuses } from '../learning/labels';
import { careerSchema, slugify } from './schemas';

const FIELDS = ['slug', 'title', 'summary', 'body', 'topic', 'external_url', 'status'] as const;

export function CareerEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  usePageTitle(isNew ? 'Add a career guide' : 'Edit career guide');
  const existing = useData(() => (id ? getCareerResource(id) : Promise.resolve(null)), id ?? 'new');

  if (existing.status === 'loading')
    return (
      <div className="container">
        <Loading label="Loading…" />
      </div>
    );
  if (existing.status === 'error')
    return (
      <div className="container">
        <LoadError message={existing.message} onRetry={existing.reload} />
      </div>
    );
  if (!isNew && !existing.data) {
    return (
      <div className="container prose">
        <h1>Guide not found</h1>
        <Link to="/staff/careers">Back to career guides</Link>
      </div>
    );
  }
  return <CareerForm existing={existing.data} />;
}

function CareerForm({ existing }: { existing: CareerResource | null }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FieldErrors<Record<(typeof FIELDS)[number], string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(Boolean(existing));
  const v = (name: (typeof FIELDS)[number]) => (existing?.[name] ?? '') as string;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = validate(
      careerSchema,
      Object.fromEntries(FIELDS.map((f) => [f, String(form.get(f) ?? '')])),
    );
    setFormError(null);
    if (result.errors) {
      setErrors(result.errors);
      setFormError('Please correct the highlighted fields.');
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (existing) await updateCareerResource(existing.id, result.data);
      else await createCareerResource(result.data);
      navigate('/staff/careers?saved=1', { replace: true });
    } catch (e) {
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <div className="container prose">
      <p>
        <Link to="/staff/careers">← Career guides</Link>
      </p>
      <h1>{existing ? 'Edit career guide' : 'Add a career guide'}</h1>
      <form className={formStyles.form} onSubmit={onSubmit} noValidate aria-label="Career guide">
        {formError && <FormStatus kind="error">{formError}</FormStatus>}
        <TextField
          label="Title"
          name="title"
          required
          maxLength={160}
          defaultValue={v('title')}
          error={errors.title}
          onChange={(event) => {
            if (!slugEdited) setSlug(slugify(event.currentTarget.value));
          }}
        />
        <TextField
          label="Web address (slug)"
          name="slug"
          required
          maxLength={100}
          value={slug}
          hint={`The guide will appear at /careers/${slug || 'your-slug'}`}
          error={errors.slug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.currentTarget.value);
          }}
        />
        <SelectField
          label="Topic"
          name="topic"
          required
          placeholder="Choose a topic"
          defaultValue={v('topic')}
          error={errors.topic}
          options={topics.map((value) => ({ value, label: topicLabels[value] }))}
        />
        <TextAreaField
          label="Summary"
          name="summary"
          required
          rows={2}
          maxLength={300}
          defaultValue={v('summary')}
          error={errors.summary}
        />
        <TextAreaField
          label="Guide text"
          name="body"
          rows={14}
          maxLength={20000}
          hint="Plain text. Leave a blank line between paragraphs."
          defaultValue={v('body')}
          error={errors.body}
        />
        <TextField
          label="Link to an external guide"
          name="external_url"
          type="url"
          hint="Optional if you have written guide text. Must start with https://"
          defaultValue={v('external_url')}
          error={errors.external_url}
        />
        <SelectField
          label="Status"
          name="status"
          required
          defaultValue={v('status') || 'draft'}
          error={errors.status}
          hint="Only published guides are shown to the public."
          options={resourceStatuses.map((value) => ({ value, label: resourceStatusLabels[value] }))}
        />
        <div className={formStyles.actions}>
          <button
            type="submit"
            className="button button--primary"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
