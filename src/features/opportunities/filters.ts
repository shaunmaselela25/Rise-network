import { z } from 'zod';
import { provinceLabels, qualificationLabels, type Province } from '../../lib/reference';
import type { QualificationLevel } from '../../lib/reference';
import { opportunityTypes, type OpportunityType } from './labels';

export const PAGE_SIZE = 12;

const provinces = Object.keys(provinceLabels) as [Province, ...Province[]];
/** Ordered lowest to highest (matches the enum order in the database). */
export const qualificationOrder = Object.keys(qualificationLabels) as [
  QualificationLevel,
  ...QualificationLevel[],
];

export type SortOrder = 'closing' | 'newest';
export type ClosingWindow = 'any' | '7' | '30';

export interface OpportunityFilters {
  q: string;
  type: OpportunityType | '';
  category: string;
  province: Province | '';
  qualification: QualificationLevel | '';
  closing: ClosingWindow;
  includeClosed: boolean;
  sort: SortOrder;
  page: number;
}

export const defaultFilters: OpportunityFilters = {
  q: '',
  type: '',
  category: '',
  province: '',
  qualification: '',
  closing: 'any',
  includeClosed: false,
  sort: 'closing',
  page: 1,
};

// Invalid values fall back to defaults rather than erroring: URLs are user-editable.
const fallback = <T extends z.ZodType>(schema: T, value: z.infer<T>) => schema.catch(value);

const filterSchema = z.object({
  q: fallback(z.string().trim().max(100), ''),
  type: fallback(z.union([z.literal(''), z.enum(opportunityTypes)]), ''),
  category: fallback(z.union([z.literal(''), z.string().regex(/^[a-z][a-z0-9_]{1,40}$/)]), ''),
  province: fallback(z.union([z.literal(''), z.enum(provinces)]), ''),
  qualification: fallback(z.union([z.literal(''), z.enum(qualificationOrder)]), ''),
  closing: fallback(z.enum(['any', '7', '30']), 'any'),
  includeClosed: z.boolean(),
  sort: fallback(z.enum(['closing', 'newest']), 'closing'),
  page: fallback(z.coerce.number().int().min(1).max(1000), 1),
});

export function parseFilters(params: URLSearchParams): OpportunityFilters {
  return filterSchema.parse({
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    category: params.get('category') ?? '',
    province: params.get('province') ?? '',
    qualification: params.get('qualification') ?? '',
    closing: params.get('closing') ?? 'any',
    includeClosed: params.get('closed') === '1',
    sort: params.get('sort') ?? 'closing',
    page: params.get('page') ?? 1,
  }) as OpportunityFilters;
}

/** Serialises filters to URL params, omitting defaults so URLs stay short and shareable. */
export function filtersToParams(filters: OpportunityFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.province) params.set('province', filters.province);
  if (filters.qualification) params.set('qualification', filters.qualification);
  if (filters.closing !== 'any') params.set('closing', filters.closing);
  if (filters.includeClosed) params.set('closed', '1');
  if (filters.sort !== 'closing') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

/**
 * Qualification levels a person with `level` meets: listings with no stated minimum, or a
 * minimum at or below their level.
 */
export function qualifyingLevels(level: QualificationLevel): QualificationLevel[] {
  return qualificationOrder.slice(0, qualificationOrder.indexOf(level) + 1);
}

export function hasActiveFilters(filters: OpportunityFilters): boolean {
  return Boolean(
    filters.q ||
    filters.type ||
    filters.category ||
    filters.province ||
    filters.qualification ||
    filters.closing !== 'any' ||
    filters.includeClosed,
  );
}
