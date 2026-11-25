import { z } from 'zod';
import type { CareerResourceInput } from '../careers/api';
import { topics } from '../careers/labels';
import type { LearningResourceInput } from '../learning/api';
import { costs, formats, levels, resourceStatuses } from '../learning/labels';

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
  .regex(/^https:\/\/[^\s/$.?#][^\s]*$/, { error: 'Enter a full link starting with https://' });

/** Mirrors constraints on public.learning_resources. */
export const learningSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: 'Use at least 3 characters.' })
    .max(160, { error: 'Use 160 characters or fewer.' }),
  description: z
    .string()
    .trim()
    .min(1, { error: 'Describe the resource.' })
    .max(3000, { error: 'Use 3000 characters or fewer.' }),
  provider_name: z
    .string()
    .trim()
    .min(2, { error: 'Enter the provider.' })
    .max(160, { error: 'Use 160 characters or fewer.' }),
  category_code: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/, { error: 'Choose a category.' }),
  level: z.enum(levels, { error: 'Choose a level.' }),
  format: z.enum(formats, { error: 'Choose a format.' }),
  cost: z.enum(costs, { error: 'Choose a cost type.' }),
  duration_text: optionalText(120),
  requirements: optionalText(2000),
  url: httpsUrl,
  status: z.enum(resourceStatuses, { error: 'Choose a status.' }),
});

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Mirrors constraints on public.career_resources. */
export const careerSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .max(100, { error: 'Use 100 characters or fewer.' })
      .regex(SLUG_PATTERN, {
        error: 'Use lowercase letters, numbers and single hyphens, e.g. writing-your-cv.',
      }),
    title: z
      .string()
      .trim()
      .min(3, { error: 'Use at least 3 characters.' })
      .max(160, { error: 'Use 160 characters or fewer.' }),
    summary: z
      .string()
      .trim()
      .min(1, { error: 'Enter a short summary.' })
      .max(300, { error: 'Use 300 characters or fewer.' }),
    body: optionalText(20000),
    topic: z.enum(topics, { error: 'Choose a topic.' }),
    external_url: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : v))
      .pipe(httpsUrl.nullable()),
    status: z.enum(resourceStatuses, { error: 'Choose a status.' }),
  })
  .refine((v) => v.body !== null || v.external_url !== null, {
    error: 'Add guide text or a link to an external guide.',
    path: ['body'],
  });

/** Suggests a slug from a title, e.g. "Writing your CV!" → "writing-your-cv". */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}

// Compile-time checks that schema output matches what the API writes.
export const _learningTypecheck = (v: z.output<typeof learningSchema>): LearningResourceInput => v;
export const _careerTypecheck = (v: z.output<typeof careerSchema>): CareerResourceInput => v;
