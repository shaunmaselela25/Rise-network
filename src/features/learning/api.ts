import type { Database } from '../../lib/database.types';
import { toUserFacing, UserFacingError } from '../../lib/errors';
import { getSupabase, type RiseSupabaseClient } from '../../lib/supabase';
import { LEARNING_PAGE_SIZE, escapeLike, type LearningFilters } from './filters';

type Public = Database['public'];
export type LearningResource = Public['Tables']['learning_resources']['Row'];
export type LearningResourceInput = Omit<
  Public['Tables']['learning_resources']['Insert'],
  'id' | 'created_at' | 'updated_at'
>;
export type LearningCategory = Public['Tables']['learning_categories']['Row'];

function client(): RiseSupabaseClient {
  const supabase = getSupabase();
  if (!supabase) throw new UserFacingError('Learning resources are not available right now.');
  return supabase;
}

const PUBLIC_COLUMNS =
  'id, title, description, provider_name, category_code, level, format, cost, duration_text, requirements, url, last_reviewed_at';

export type PublicLearningResource = Pick<
  LearningResource,
  | 'id'
  | 'title'
  | 'description'
  | 'provider_name'
  | 'category_code'
  | 'level'
  | 'format'
  | 'cost'
  | 'duration_text'
  | 'requirements'
  | 'url'
  | 'last_reviewed_at'
>;

export async function listLearningCategories(): Promise<LearningCategory[]> {
  const { data, error } = await client()
    .from('learning_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw toUserFacing(error, 'We could not load categories.');
  return data;
}

/** Published resources only (RLS also hides drafts from non-staff). */
export async function listPublishedLearning(
  filters: LearningFilters,
): Promise<{ items: PublicLearningResource[]; total: number }> {
  let query = client()
    .from('learning_resources')
    .select(PUBLIC_COLUMNS, { count: 'exact' })
    .eq('status', 'published');
  if (filters.q) query = query.ilike('title', `%${escapeLike(filters.q)}%`);
  if (filters.category) query = query.eq('category_code', filters.category);
  if (filters.level) query = query.eq('level', filters.level);
  if (filters.format) query = query.eq('format', filters.format);
  if (filters.cost) query = query.eq('cost', filters.cost);
  const from = (filters.page - 1) * LEARNING_PAGE_SIZE;
  const { data, error, count } = await query
    .order('title')
    .order('id')
    .range(from, from + LEARNING_PAGE_SIZE - 1);
  if (error) throw toUserFacing(error, 'We could not load learning resources. Please try again.');
  return { items: data as PublicLearningResource[], total: count ?? 0 };
}

// --- Staff management (FR-011). RLS allows writes only for moderators/admins. ---

export async function listAllLearning(): Promise<LearningResource[]> {
  const { data, error } = await client()
    .from('learning_resources')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw toUserFacing(error, 'We could not load learning resources.');
  return data;
}

export async function getLearningResource(id: string): Promise<LearningResource | null> {
  const { data, error } = await client()
    .from('learning_resources')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw toUserFacing(error, 'We could not load this resource.');
  return data;
}

function stamp(input: LearningResourceInput): LearningResourceInput {
  // Publishing records when the resource was last reviewed.
  return input.status === 'published'
    ? { ...input, last_reviewed_at: new Date().toISOString() }
    : input;
}

export async function createLearningResource(input: LearningResourceInput): Promise<string> {
  const { data, error } = await client()
    .from('learning_resources')
    .insert(stamp(input))
    .select('id')
    .single();
  if (error)
    throw toUserFacing(error, 'We could not save this resource. Please check the details.');
  return data.id;
}

export async function updateLearningResource(
  id: string,
  input: LearningResourceInput,
): Promise<void> {
  const { data, error } = await client()
    .from('learning_resources')
    .update(stamp(input))
    .eq('id', id)
    .select('id');
  if (error)
    throw toUserFacing(error, 'We could not save this resource. Please check the details.');
  if (data.length === 0) throw new UserFacingError('You do not have permission to change this.');
}
