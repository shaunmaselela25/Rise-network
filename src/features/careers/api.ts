import type { Database } from '../../lib/database.types';
import { toUserFacing, UserFacingError } from '../../lib/errors';
import { getSupabase, type RiseSupabaseClient } from '../../lib/supabase';

type Public = Database['public'];
export type CareerResource = Public['Tables']['career_resources']['Row'];
export type CareerResourceInput = Omit<
  Public['Tables']['career_resources']['Insert'],
  'id' | 'created_at' | 'updated_at'
>;
export type CareerTopic = Public['Enums']['career_topic'];

function client(): RiseSupabaseClient {
  const supabase = getSupabase();
  if (!supabase) throw new UserFacingError('Career resources are not available right now.');
  return supabase;
}

const LIST_COLUMNS = 'id, slug, title, summary, topic, external_url, last_reviewed_at';
export type CareerListItem = Pick<
  CareerResource,
  'id' | 'slug' | 'title' | 'summary' | 'topic' | 'external_url' | 'last_reviewed_at'
>;

export async function listPublishedCareers(): Promise<CareerListItem[]> {
  const { data, error } = await client()
    .from('career_resources')
    .select(LIST_COLUMNS)
    .eq('status', 'published')
    .order('topic')
    .order('title');
  if (error) throw toUserFacing(error, 'We could not load career guides. Please try again.');
  return data as CareerListItem[];
}

export async function getPublishedCareerBySlug(slug: string): Promise<CareerResource | null> {
  const { data, error } = await client()
    .from('career_resources')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw toUserFacing(error, 'We could not load this guide. Please try again.');
  return data;
}

// --- Staff management (FR-012) ---

export async function listAllCareers(): Promise<CareerResource[]> {
  const { data, error } = await client()
    .from('career_resources')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw toUserFacing(error, 'We could not load career guides.');
  return data;
}

export async function getCareerResource(id: string): Promise<CareerResource | null> {
  const { data, error } = await client()
    .from('career_resources')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw toUserFacing(error, 'We could not load this guide.');
  return data;
}

function stamp(input: CareerResourceInput): CareerResourceInput {
  return input.status === 'published'
    ? { ...input, last_reviewed_at: new Date().toISOString() }
    : input;
}

function saveError(error: { code?: string; message?: string }) {
  if (error.code === '23505')
    return new UserFacingError('Another guide already uses this web address (slug).');
  return toUserFacing(error, 'We could not save this guide. Please check the details.');
}

export async function createCareerResource(input: CareerResourceInput): Promise<string> {
  const { data, error } = await client()
    .from('career_resources')
    .insert(stamp(input))
    .select('id')
    .single();
  if (error) throw saveError(error);
  return data.id;
}

export async function updateCareerResource(id: string, input: CareerResourceInput): Promise<void> {
  const { data, error } = await client()
    .from('career_resources')
    .update(stamp(input))
    .eq('id', id)
    .select('id');
  if (error) throw saveError(error);
  if (data.length === 0) throw new UserFacingError('You do not have permission to change this.');
}
