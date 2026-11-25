import { z } from 'zod';
import {
  costs,
  formats,
  levels,
  type CostType,
  type LearningFormat,
  type LearningLevel,
} from './labels';

export const LEARNING_PAGE_SIZE = 12;

export interface LearningFilters {
  q: string;
  category: string;
  level: LearningLevel | '';
  format: LearningFormat | '';
  cost: CostType | '';
  page: number;
}

export const defaultLearningFilters: LearningFilters = {
  q: '',
  category: '',
  level: '',
  format: '',
  cost: '',
  page: 1,
};

const schema = z.object({
  q: z.string().trim().max(100).catch(''),
  category: z.union([z.literal(''), z.string().regex(/^[a-z][a-z0-9_]{1,40}$/)]).catch(''),
  level: z.union([z.literal(''), z.enum(levels)]).catch(''),
  format: z.union([z.literal(''), z.enum(formats)]).catch(''),
  cost: z.union([z.literal(''), z.enum(costs)]).catch(''),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export function parseLearningFilters(params: URLSearchParams): LearningFilters {
  return schema.parse({
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    level: params.get('level') ?? '',
    format: params.get('format') ?? '',
    cost: params.get('cost') ?? '',
    page: params.get('page') ?? 1,
  }) as LearningFilters;
}

export function learningFiltersToParams(filters: LearningFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ['q', 'category', 'level', 'format', 'cost'] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

/** Escapes LIKE wildcards so user text is matched literally. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
