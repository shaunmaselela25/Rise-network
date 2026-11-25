import { z } from 'zod';
import { provinceLabels, type Province } from '../../lib/reference';
import type { SubmissionContent } from './api';
import { qualificationOrder } from './filters';
import { deliveryModes, opportunityTypes } from './labels';

const provinces = Object.keys(provinceLabels) as [Province, ...Province[]];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Use ${max} characters or fewer.` })
    .transform((v) => (v === '' ? null : v));

const httpsUrl = z
  .string()
  .trim()
  .max(2048, { error: 'This link is too long.' })
  .regex(/^https:\/\/[^\s/$.?#][^\s]*$/, {
    error: 'Enter a full link starting with https://',
  });

const optionalHttpsUrl = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .pipe(httpsUrl.nullable());

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.literal(''), z.enum(values)]).transform((v) => (v === '' ? null : (v as T[number])));

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), { error: 'Enter a valid date.' })
  .transform((v) => (v === '' ? null : v));

const optionalAge = z
  .string()
  .trim()
  .refine((v) => v === '' || (/^\d{1,3}$/.test(v) && Number(v) <= 120), {
    error: 'Enter an age between 0 and 120.',
  })
  .transform((v) => (v === '' ? null : Number(v)));

/**
 * Mirrors the database constraints on public.opportunities so users get clear messages.
 * The database remains the authority.
 */
export const submissionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, { error: 'Use at least 5 characters.' })
      .max(160, { error: 'Use 160 characters or fewer.' }),
    summary: z
      .string()
      .trim()
      .min(1, { error: 'Enter a short summary.' })
      .max(300, { error: 'Use 300 characters or fewer.' }),
    description: z
      .string()
      .trim()
      .min(1, { error: 'Describe the opportunity.' })
      .max(10000, { error: 'Use 10 000 characters or fewer.' }),
    opportunity_type: z.enum(opportunityTypes, { error: 'Choose the type of opportunity.' }),
    category_code: z
      .string()
      .regex(/^[a-z][a-z0-9_]{1,40}$/, { error: 'Choose the field this opportunity is in.' }),
    provider_name: z
      .string()
      .trim()
      .min(2, { error: 'Enter the organisation offering this opportunity.' })
      .max(160, { error: 'Use 160 characters or fewer.' }),
    provider_url: optionalHttpsUrl,
    source_url: httpsUrl,
    application_url: optionalHttpsUrl,
    application_instructions: optionalText(2000),
    province: optionalEnum(provinces),
    location_text: optionalText(160),
    delivery_mode: optionalEnum(deliveryModes),
    eligibility: optionalText(5000),
    required_documents: optionalText(3000),
    required_skills: optionalText(3000),
    min_qualification: optionalEnum(qualificationOrder),
    age_min: optionalAge,
    age_max: optionalAge,
    opens_at: optionalDate,
    closes_at: optionalDate,
    duration_text: optionalText(160),
    financial_details: optionalText(2000),
    contact_info: optionalText(500),
  })
  .refine((v) => !v.opens_at || !v.closes_at || v.opens_at <= v.closes_at, {
    error: 'The closing date must be on or after the opening date.',
    path: ['closes_at'],
  })
  .refine((v) => v.age_min === null || v.age_max === null || v.age_min <= v.age_max, {
    error: 'The maximum age must be at least the minimum age.',
    path: ['age_max'],
  });

export type SubmissionFormValues = z.input<typeof submissionSchema>;

// Compile-time check that the schema output matches the columns we write.
export const _typecheck = (v: z.output<typeof submissionSchema>): SubmissionContent => v;

/** The form's text inputs, as strings, from an existing row (for editing). */
export function toFormValues(row: Partial<SubmissionContent> | null): Record<string, string> {
  const values: Record<string, string> = {};
  if (!row) return values;
  for (const [key, value] of Object.entries(row)) {
    values[key] = value === null || value === undefined ? '' : String(value);
  }
  return values;
}
