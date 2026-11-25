import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { LoadError, Loading } from '../../components/AsyncStates';
import { SelectField, TextAreaField, TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { errorMessage, useData } from '../../lib/errors';
import { usePageTitle } from '../../lib/usePageTitle';
import { validate, type FieldErrors } from '../../lib/validation';
import {
  createLearningResource,
  getLearningResource,
  listLearningCategories,
  updateLearningResource,
  type LearningResource,
} from '../learning/api';
import {
  costLabels,
  costs,
  formatLabels,
  formats,
  levelLabels,
  levels,
  resourceStatusLabels,
  resourceStatuses,
} from '../learning/labels';
import { learningSchema } from './schemas';

const FIELDS = [
  'title',
  'description',
  'provider_name',
  'category_code',
  'level',
  'format',
  'cost',
  'duration_text',
  'requirements',
  'url',
  'status',
] as const;

export function LearningEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  usePageTitle(isNew ? 'Add a learning resource' : 'Edit learning resource');
  const existing = useData(
    () => (id ? getLearningResource(id) : Promise.resolve(null)),
    id ?? 'new',
  );

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
        <h1>Resource not found</h1>
        <Link to="/staff/learning">Back to learning resources</Link>
      </div>
    );
  }
  return <LearningForm existing={existing.data} />;
}

function LearningForm({ existing }: { existing: LearningResource | null }) {
  const navigate = useNavigate();
  const categories = useData(listLearningCategories, 'learning-categories');
  const [errors, setErrors] = useState<FieldErrors<Record<(typeof FIELDS)[number], string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const v = (name: (typeof FIELDS)[number]) => (existing?.[name] ?? '') as string;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = validate(
      learningSchema,
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
      if (existing) await updateLearningResource(existing.id, result.data);
      else await createLearningResource(result.data);
      navigate('/staff/learning?saved=1', { replace: true });
    } catch (e) {
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  // defaultValue on the category <select> needs its options present on first render.
  if (categories.status === 'loading') {
    return (
      <div className="container">
        <Loading label="Loading…" />
      </div>
    );
  }
  if (categories.status === 'error') {
    return (
      <div className="container">
        <LoadError message={categories.message} onRetry={categories.reload} />
      </div>
    );
  }

  return (
    <div className="container prose">
      <p>
        <Link to="/staff/learning">← Learning resources</Link>
      </p>
      <h1>{existing ? 'Edit learning resource' : 'Add a learning resource'}</h1>
      <p>
        Describe the resource factually. Do not claim accreditation unless the provider states it.
      </p>
      <form
        className={formStyles.form}
        onSubmit={onSubmit}
        noValidate
        aria-label="Learning resource"
      >
        {formError && <FormStatus kind="error">{formError}</FormStatus>}
        <TextField
          label="Title"
          name="title"
          required
          maxLength={160}
          defaultValue={v('title')}
          error={errors.title}
        />
        <TextField
          label="Provider"
          name="provider_name"
          required
          maxLength={160}
          defaultValue={v('provider_name')}
          error={errors.provider_name}
        />
        <TextField
          label="Link to the resource"
          name="url"
          type="url"
          required
          hint="Must start with https://"
          defaultValue={v('url')}
          error={errors.url}
        />
        <TextAreaField
          label="Description"
          name="description"
          required
          rows={5}
          maxLength={3000}
          defaultValue={v('description')}
          error={errors.description}
        />
        <SelectField
          label="Category"
          name="category_code"
          required
          placeholder="Choose a category"
          defaultValue={v('category_code')}
          error={errors.category_code}
          options={
            categories.status === 'ready'
              ? categories.data.map((c) => ({ value: c.code, label: c.label }))
              : []
          }
        />
        <SelectField
          label="Level"
          name="level"
          required
          defaultValue={v('level') || 'all_levels'}
          error={errors.level}
          options={levels.map((value) => ({ value, label: levelLabels[value] }))}
        />
        <SelectField
          label="Format"
          name="format"
          required
          placeholder="Choose a format"
          defaultValue={v('format')}
          error={errors.format}
          options={formats.map((value) => ({ value, label: formatLabels[value] }))}
        />
        <SelectField
          label="Cost"
          name="cost"
          required
          defaultValue={v('cost') || 'unknown'}
          error={errors.cost}
          hint="Use “Cost not confirmed” unless the provider states the cost."
          options={costs.map((value) => ({ value, label: costLabels[value] }))}
        />
        <TextField
          label="Duration"
          name="duration_text"
          maxLength={120}
          defaultValue={v('duration_text')}
          error={errors.duration_text}
        />
        <TextAreaField
          label="Requirements"
          name="requirements"
          rows={3}
          maxLength={2000}
          defaultValue={v('requirements')}
          error={errors.requirements}
        />
        <SelectField
          label="Status"
          name="status"
          required
          defaultValue={v('status') || 'draft'}
          error={errors.status}
          hint="Only published resources are shown to the public. Publishing records today as the review date."
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
