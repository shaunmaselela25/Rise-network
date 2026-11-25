import type { Database } from '../../lib/database.types';
import { addDays, todaySast } from '../../lib/dates';
import { toUserFacing, UserFacingError } from '../../lib/errors';
import { getSupabase, type RiseSupabaseClient } from '../../lib/supabase';
import { PAGE_SIZE, qualifyingLevels, type OpportunityFilters } from './filters';
import type { ReportReason, TrackingStatus } from './labels';

type Public = Database['public'];
export type PublicOpportunity = Omit<
  Public['Views']['public_opportunities']['Row'],
  'search_vector'
>;
export type OpportunityRow = Public['Tables']['opportunities']['Row'];
export type OpportunityInsert = Public['Tables']['opportunities']['Insert'];
export type Category = Public['Tables']['opportunity_categories']['Row'];
export type Review = Public['Tables']['opportunity_reviews']['Row'];
export type Report = Public['Tables']['reports']['Row'];
export type ReviewAction = Public['Enums']['review_action'];
export type VerificationStatus = Public['Enums']['verification_status'];

export { UserFacingError };

function client(): RiseSupabaseClient {
  const supabase = getSupabase();
  if (!supabase) throw new UserFacingError('Opportunities are not available in this environment.');
  return supabase;
}

function fail(error: { code?: string; message?: string }, fallback: string): never {
  throw toUserFacing(error, fallback);
}

// Explicit public column list (never select *; search_vector is not needed by the UI).
const PUBLIC_COLUMNS =
  'id, slug, title, summary, description, opportunity_type, category_code, provider_name, provider_url, source_url, application_url, application_instructions, location_text, province, municipality, delivery_mode, eligibility, required_documents, required_skills, min_qualification, age_min, age_max, opens_at, closes_at, duration_text, financial_details, contact_info, verification_status, last_checked_at, published_at, updated_at, is_closed';

const CARD_COLUMNS =
  'id, slug, title, summary, opportunity_type, category_code, provider_name, province, delivery_mode, closes_at, verification_status, is_closed, published_at';

export type OpportunityCardData = Pick<
  PublicOpportunity,
  | 'id'
  | 'slug'
  | 'title'
  | 'summary'
  | 'opportunity_type'
  | 'category_code'
  | 'provider_name'
  | 'province'
  | 'delivery_mode'
  | 'closes_at'
  | 'verification_status'
  | 'is_closed'
  | 'published_at'
>;

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await client()
    .from('opportunity_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) fail(error, 'We could not load categories.');
  return data;
}

export async function listOpportunities(
  filters: OpportunityFilters,
): Promise<{ items: OpportunityCardData[]; total: number }> {
  const today = todaySast();
  let query = client().from('public_opportunities').select(CARD_COLUMNS, { count: 'exact' });

  if (filters.q) {
    query = query.textSearch('search_vector', filters.q, { type: 'websearch', config: 'english' });
  }
  if (filters.type) query = query.eq('opportunity_type', filters.type);
  if (filters.category) query = query.eq('category_code', filters.category);
  if (filters.province) query = query.eq('province', filters.province);
  if (filters.qualification) {
    const levels = qualifyingLevels(filters.qualification).join(',');
    query = query.or(`min_qualification.is.null,min_qualification.in.(${levels})`);
  }
  if (!filters.includeClosed) query = query.eq('is_closed', false);
  if (filters.closing !== 'any') {
    query = query.gte('closes_at', today).lte('closes_at', addDays(today, Number(filters.closing)));
  }

  query =
    filters.sort === 'newest'
      ? query.order('published_at', { ascending: false })
      : query.order('closes_at', { ascending: true, nullsFirst: false });
  query = query.order('id'); // stable pagination

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) fail(error, 'We could not load opportunities. Please try again.');
  return { items: data as OpportunityCardData[], total: count ?? 0 };
}

export async function getOpportunityBySlug(slug: string): Promise<PublicOpportunity | null> {
  const { data, error } = await client()
    .from('public_opportunities')
    .select(PUBLIC_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) fail(error, 'We could not load this opportunity. Please try again.');
  return data as PublicOpportunity | null;
}

export async function getPublicOpportunitiesByIds(ids: string[]): Promise<OpportunityCardData[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client()
    .from('public_opportunities')
    .select(CARD_COLUMNS)
    .in('id', ids);
  if (error) fail(error, 'We could not load your saved opportunities.');
  return data as OpportunityCardData[];
}

// ---------------------------------------------------------------------------
// Saved opportunities (FR-007)
// ---------------------------------------------------------------------------
export interface SavedEntry {
  opportunity_id: string;
  tracking_status: TrackingStatus;
  created_at: string;
}

export async function listSaved(): Promise<SavedEntry[]> {
  const { data, error } = await client()
    .from('saved_opportunities')
    .select('opportunity_id, tracking_status, created_at')
    .order('created_at', { ascending: false });
  if (error) fail(error, 'We could not load your saved opportunities.');
  return data;
}

export async function isSaved(opportunityId: string): Promise<boolean> {
  const { data, error } = await client()
    .from('saved_opportunities')
    .select('opportunity_id')
    .eq('opportunity_id', opportunityId)
    .maybeSingle();
  if (error) fail(error, 'We could not check whether this is saved.');
  return data !== null;
}

export async function saveOpportunity(opportunityId: string): Promise<void> {
  const { error } = await client()
    .from('saved_opportunities')
    .insert({ opportunity_id: opportunityId });
  if (error && error.code !== '23505') fail(error, 'We could not save this opportunity.');
}

export async function unsaveOpportunity(opportunityId: string): Promise<void> {
  const { error } = await client()
    .from('saved_opportunities')
    .delete()
    .eq('opportunity_id', opportunityId);
  if (error) fail(error, 'We could not remove this opportunity.');
}

export async function setTrackingStatus(
  opportunityId: string,
  status: TrackingStatus,
): Promise<void> {
  const { error } = await client()
    .from('saved_opportunities')
    .update({ tracking_status: status })
    .eq('opportunity_id', opportunityId);
  if (error) fail(error, 'We could not update the status.');
}

// ---------------------------------------------------------------------------
// Reports (FR-014)
// ---------------------------------------------------------------------------
export async function reportOpportunity(
  opportunityId: string,
  reason: ReportReason,
  details: string,
): Promise<void> {
  const { error } = await client()
    .from('reports')
    .insert({ opportunity_id: opportunityId, reason, details: details || null });
  if (error) fail(error, 'We could not send your report. Please try again.');
}

// ---------------------------------------------------------------------------
// Submissions (FR-008)
// ---------------------------------------------------------------------------
export type SubmissionContent = Omit<
  OpportunityInsert,
  | 'id'
  | 'slug'
  | 'status'
  | 'verification_status'
  | 'verification_notes'
  | 'last_checked_at'
  | 'published_at'
  | 'submitted_by'
  | 'search_vector'
  | 'created_at'
  | 'updated_at'
>;

export async function createSubmission(
  content: SubmissionContent,
  submitForReview: boolean,
): Promise<string> {
  const { data, error } = await client()
    .from('opportunities')
    .insert({ ...content, status: submitForReview ? 'pending_review' : 'draft' })
    .select('id')
    .single();
  if (error) fail(error, 'We could not save your submission. Please check the details.');
  return data.id;
}

export async function updateSubmission(id: string, content: SubmissionContent): Promise<void> {
  const { data, error } = await client()
    .from('opportunities')
    .update(content)
    .eq('id', id)
    .select('id');
  if (error) fail(error, 'We could not save your changes. Please check the details.');
  if (data.length === 0) {
    throw new UserFacingError('This submission can no longer be edited.');
  }
}

export async function submitForReview(id: string): Promise<void> {
  const { error } = await client().rpc('submit_opportunity', { opportunity: id });
  if (error) fail(error, 'We could not submit this for review.');
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await client().from('opportunities').delete().eq('id', id);
  if (error) fail(error, 'We could not delete this draft.');
}

export async function listMySubmissions(userId: string): Promise<OpportunityRow[]> {
  const { data, error } = await client()
    .from('opportunities')
    .select('*')
    .eq('submitted_by', userId)
    .order('updated_at', { ascending: false });
  if (error) fail(error, 'We could not load your submissions.');
  return data;
}

/** Own submission (RLS) or any opportunity for staff. */
export async function getOpportunityForEditing(id: string): Promise<OpportunityRow | null> {
  const { data, error } = await client()
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) fail(error, 'We could not load this submission.');
  return data;
}

export async function listReviews(opportunityId: string): Promise<Review[]> {
  const { data, error } = await client()
    .from('opportunity_reviews')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });
  if (error) fail(error, 'We could not load the review history.');
  return data;
}

// ---------------------------------------------------------------------------
// Moderation (FR-009, FR-010, FR-015) — staff only; enforced by the database.
// ---------------------------------------------------------------------------
export async function listForModeration(
  status: 'pending_review' | 'published',
): Promise<OpportunityRow[]> {
  const { data, error } = await client()
    .from('opportunities')
    .select('*')
    .eq('status', status)
    .order(status === 'pending_review' ? 'created_at' : 'last_checked_at', {
      ascending: true,
      nullsFirst: true,
    })
    .limit(200);
  if (error) fail(error, 'We could not load the moderation queue.');
  return data;
}

export async function reviewOpportunity(
  id: string,
  action: ReviewAction,
  note: string,
  verification: VerificationStatus | null,
): Promise<void> {
  const { error } = await client().rpc('review_opportunity', {
    opportunity: id,
    review: action,
    ...(note ? { note } : {}),
    ...(verification ? { new_verification: verification } : {}),
  });
  if (error) fail(error, 'We could not record this decision.');
}

export type ReportWithOpportunity = Report & {
  opportunities: { id: string; title: string; slug: string; status: string } | null;
};

export async function listOpenReports(): Promise<ReportWithOpportunity[]> {
  const { data, error } = await client()
    .from('reports')
    .select('*, opportunities(id, title, slug, status)')
    .eq('status', 'open')
    .order('created_at', { ascending: true });
  if (error) fail(error, 'We could not load reports.');
  return data as ReportWithOpportunity[];
}

export async function resolveReport(
  id: string,
  outcome: 'dismissed' | 'actioned',
  note: string,
): Promise<void> {
  const { error } = await client().rpc('resolve_report', {
    report: id,
    outcome,
    ...(note ? { note } : {}),
  });
  if (error) fail(error, 'We could not resolve this report.');
}
