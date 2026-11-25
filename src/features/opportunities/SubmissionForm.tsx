import { useState, type FormEvent } from 'react';
import { SelectField, TextAreaField, TextField } from '../../components/form/Field';
import { FormStatus } from '../../components/form/FormStatus';
import formStyles from '../../components/form/Form.module.css';
import { provinceLabels, qualificationLabels, type Province } from '../../lib/reference';
import { validate, type FieldErrors } from '../../lib/validation';
import { listCategories, type SubmissionContent } from './api';
import { qualificationOrder } from './filters';
import {
  deliveryModeLabels,
  deliveryModes,
  opportunityTypeLabels,
  opportunityTypes,
} from './labels';
import { submissionSchema, type SubmissionFormValues } from './submissionSchema';
import { errorMessage, useOpportunityData } from './useOpportunityData';
import { LoadError, Loading } from '../../components/AsyncStates';

type Intent = 'draft' | 'submit';

interface SubmissionFormProps {
  initialValues: Record<string, string>;
  onSave: (content: SubmissionContent, intent: Intent) => Promise<void>;
  /** Whether to offer "Save as draft" (only while the item is still a draft). */
  allowDraft: boolean;
  submitLabel: string;
}

const FIELD_NAMES = [
  'title',
  'summary',
  'description',
  'opportunity_type',
  'category_code',
  'provider_name',
  'provider_url',
  'source_url',
  'application_url',
  'application_instructions',
  'province',
  'location_text',
  'delivery_mode',
  'eligibility',
  'required_documents',
  'required_skills',
  'min_qualification',
  'age_min',
  'age_max',
  'opens_at',
  'closes_at',
  'duration_text',
  'financial_details',
  'contact_info',
] as const;

export function SubmissionForm({
  initialValues,
  onSave,
  allowDraft,
  submitLabel,
}: SubmissionFormProps) {
  const categories = useOpportunityData(listCategories, 'categories');
  const [errors, setErrors] = useState<FieldErrors<SubmissionFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent: Intent = submitter?.value === 'draft' ? 'draft' : 'submit';
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(FIELD_NAMES.map((name) => [name, String(form.get(name) ?? '')]));
    const result = validate(submissionSchema, raw);
    setFormError(null);
    if (result.errors) {
      setErrors(result.errors);
      setFormError('Please correct the highlighted fields.');
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave(result.data, intent);
    } catch (e) {
      setFormError(errorMessage(e, 'We could not save this. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  const v = (name: (typeof FIELD_NAMES)[number]) => initialValues[name] ?? '';

  // The category <select> uses defaultValue, which only applies if its option exists on
  // first render — so render the form once categories have loaded.
  if (categories.status === 'loading') return <Loading label="Loading form…" />;
  if (categories.status === 'error') {
    return <LoadError message={categories.message} onRetry={categories.reload} />;
  }

  return (
    <form
      className={formStyles.form}
      onSubmit={onSubmit}
      noValidate
      aria-label="Opportunity details"
    >
      {formError && <FormStatus kind="error">{formError}</FormStatus>}

      <fieldset>
        <legend>
          <h2>The opportunity</h2>
        </legend>
        <div className={formStyles.form}>
          <TextField
            label="Title"
            name="title"
            required
            maxLength={160}
            defaultValue={v('title')}
            error={errors.title}
          />
          <TextAreaField
            label="Short summary"
            name="summary"
            required
            rows={2}
            maxLength={300}
            hint="One or two sentences shown in search results."
            defaultValue={v('summary')}
            error={errors.summary}
          />
          <TextAreaField
            label="Full description"
            name="description"
            required
            rows={8}
            maxLength={10000}
            hint="Use the provider’s own information. Do not add details you cannot confirm."
            defaultValue={v('description')}
            error={errors.description}
          />
          <SelectField
            label="Type"
            name="opportunity_type"
            required
            placeholder="Choose a type"
            defaultValue={v('opportunity_type')}
            error={errors.opportunity_type}
            options={opportunityTypes.map((value) => ({
              value,
              label: opportunityTypeLabels[value],
            }))}
          />
          <SelectField
            label="Field"
            name="category_code"
            required
            placeholder="Choose a field"
            defaultValue={v('category_code')}
            error={errors.category_code}
            options={
              categories.status === 'ready'
                ? categories.data.map((c) => ({ value: c.code, label: c.label }))
                : []
            }
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <h2>Provider and source</h2>
        </legend>
        <div className={formStyles.form}>
          <TextField
            label="Organisation offering it"
            name="provider_name"
            required
            maxLength={160}
            defaultValue={v('provider_name')}
            error={errors.provider_name}
          />
          <TextField
            label="Where did you find this information?"
            name="source_url"
            type="url"
            required
            hint="A link to the provider’s official page. Required, so reviewers can check it."
            defaultValue={v('source_url')}
            error={errors.source_url}
          />
          <TextField
            label="Provider website"
            name="provider_url"
            type="url"
            defaultValue={v('provider_url')}
            error={errors.provider_url}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <h2>How to apply</h2>
        </legend>
        <div className={formStyles.form}>
          <TextField
            label="Application link"
            name="application_url"
            type="url"
            hint="The provider’s official application page."
            defaultValue={v('application_url')}
            error={errors.application_url}
          />
          <TextAreaField
            label="Application instructions"
            name="application_instructions"
            maxLength={2000}
            hint="Only if there is no online application, e.g. how to apply in person."
            defaultValue={v('application_instructions')}
            error={errors.application_instructions}
          />
          <TextField
            label="Applications open"
            name="opens_at"
            type="date"
            defaultValue={v('opens_at')}
            error={errors.opens_at}
          />
          <TextField
            label="Closing date"
            name="closes_at"
            type="date"
            hint="Leave blank only if the provider states there is no fixed closing date."
            defaultValue={v('closes_at')}
            error={errors.closes_at}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <h2>Location and eligibility</h2>
        </legend>
        <div className={formStyles.form}>
          <SelectField
            label="Province"
            name="province"
            placeholder="Not specified"
            defaultValue={v('province')}
            error={errors.province}
            options={(Object.keys(provinceLabels) as Province[]).map((value) => ({
              value,
              label: provinceLabels[value],
            }))}
          />
          <TextField
            label="Town or city"
            name="location_text"
            maxLength={160}
            defaultValue={v('location_text')}
            error={errors.location_text}
          />
          <SelectField
            label="Format"
            name="delivery_mode"
            placeholder="Not specified"
            defaultValue={v('delivery_mode')}
            error={errors.delivery_mode}
            options={deliveryModes.map((value) => ({ value, label: deliveryModeLabels[value] }))}
          />
          <SelectField
            label="Minimum qualification"
            name="min_qualification"
            placeholder="Not specified"
            defaultValue={v('min_qualification')}
            error={errors.min_qualification}
            options={qualificationOrder.map((value) => ({
              value,
              label: qualificationLabels[value],
            }))}
          />
          <TextAreaField
            label="Who can apply"
            name="eligibility"
            maxLength={5000}
            defaultValue={v('eligibility')}
            error={errors.eligibility}
          />
          <TextAreaField
            label="Documents needed"
            name="required_documents"
            maxLength={3000}
            defaultValue={v('required_documents')}
            error={errors.required_documents}
          />
          <TextAreaField
            label="Skills needed"
            name="required_skills"
            maxLength={3000}
            defaultValue={v('required_skills')}
            error={errors.required_skills}
          />
          <TextField
            label="Minimum age"
            name="age_min"
            inputMode="numeric"
            hint="Only if the provider states an age requirement."
            defaultValue={v('age_min')}
            error={errors.age_min}
          />
          <TextField
            label="Maximum age"
            name="age_max"
            inputMode="numeric"
            defaultValue={v('age_max')}
            error={errors.age_max}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <h2>Other details</h2>
        </legend>
        <div className={formStyles.form}>
          <TextField
            label="Duration"
            name="duration_text"
            maxLength={160}
            hint="For example “12 months”."
            defaultValue={v('duration_text')}
            error={errors.duration_text}
          />
          <TextAreaField
            label="Funding and costs"
            name="financial_details"
            maxLength={2000}
            hint="What is covered, and any costs to the applicant, exactly as the provider states."
            defaultValue={v('financial_details')}
            error={errors.financial_details}
          />
          <TextAreaField
            label="Provider contact details"
            name="contact_info"
            rows={2}
            maxLength={500}
            hint="Official contact details published by the provider only."
            defaultValue={v('contact_info')}
            error={errors.contact_info}
          />
        </div>
      </fieldset>

      <div className={formStyles.actions}>
        <button
          type="submit"
          name="intent"
          value="submit"
          className="button button--primary"
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        {allowDraft && (
          <button
            type="submit"
            name="intent"
            value="draft"
            className="button button--secondary"
            disabled={saving}
          >
            Save as draft
          </button>
        )}
      </div>
    </form>
  );
}
