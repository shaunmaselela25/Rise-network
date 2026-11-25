import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession } from '../../test/mockSupabase';
import { createQueryClient } from '../../test/mockQuery';
import { renderRoute } from '../../test/renderRoute';
import { isStale } from './freshness';

const mocks = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('../../lib/supabase', () => ({ getSupabase: () => mocks.client }));

let client: ReturnType<typeof createQueryClient>;

const pending = {
  id: 'p1',
  slug: 'pending-item-p1',
  title: 'Pending internship',
  summary: 'Summary',
  description: 'Description',
  opportunity_type: 'internship',
  category_code: 'ict',
  provider_name: 'Example Org',
  provider_url: null,
  source_url: 'https://example.org/internship',
  application_url: 'https://example.org/apply',
  application_instructions: null,
  province: null,
  location_text: null,
  municipality: null,
  delivery_mode: null,
  eligibility: null,
  required_documents: null,
  required_skills: null,
  min_qualification: null,
  age_min: null,
  age_max: null,
  opens_at: null,
  closes_at: null,
  duration_text: null,
  financial_details: null,
  contact_info: null,
  status: 'pending_review',
  verification_status: 'unverified',
  verification_notes: null,
  last_checked_at: null,
  published_at: null,
  submitted_by: 'someone',
  created_at: '2026-11-24T08:00:00Z',
  updated_at: '2026-11-24T08:00:00Z',
};

function useClient(roles: string[], rpcError: unknown = null) {
  client = createQueryClient({
    session: fakeSession(),
    tables: {
      user_roles: { data: roles.map((role) => ({ role })), error: null },
      opportunities: { data: [pending], error: null },
      opportunity_reviews: { data: [], error: null },
      reports: { data: [], error: null },
    },
    rpc: () => ({ data: 'published', error: rpcError }),
  });
  mocks.client = client;
}

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:55321');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-test-anon-key');
});

describe('moderation access (FR-009)', () => {
  it('tells non-staff they are not authorised and loads no moderation data', async () => {
    useClient([]);
    renderRoute('/moderation');
    expect(await screen.findByRole('heading', { name: /not authorised/i })).toBeInTheDocument();
    expect(client.callsTo('opportunities', 'select')).toHaveLength(0);
  });

  it('shows the review queue and Moderation link to staff', async () => {
    useClient(['moderator']);
    renderRoute('/moderation');
    expect(await screen.findByRole('link', { name: 'Pending internship' })).toHaveAttribute(
      'href',
      '/moderation/p1',
    );
    expect(
      within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', {
        name: 'Moderation',
      }),
    ).toBeInTheDocument();
  });
});

describe('review decisions (FR-010)', () => {
  it('sends the publish decision with the chosen verification status', async () => {
    useClient(['moderator']);
    const { user } = renderRoute('/moderation/p1');
    await screen.findByRole('heading', { level: 1, name: 'Pending internship' });
    await user.selectOptions(
      screen.getByRole('combobox', { name: /verification status/i }),
      'source_checked',
    );
    await user.type(screen.getByRole('textbox', { name: /^note/i }), 'Checked on provider site');
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(client.rpc).toHaveBeenCalledWith('review_opportunity', {
      opportunity: 'p1',
      review: 'publish',
      note: 'Checked on provider site',
      new_verification: 'source_checked',
    });
    expect(await screen.findByText(/published\. the listing is now public/i)).toBeInTheDocument();
  });

  it('shows the database rule message when a decision is refused', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useClient(['moderator'], {
      code: '22023',
      message: 'Verify the source (source_checked or provider_confirmed) before publishing',
    });
    const { user } = renderRoute('/moderation/p1');
    await screen.findByRole('heading', { level: 1, name: 'Pending internship' });
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/verify the source/i);
  });
});

describe('freshness rule (D-06)', () => {
  const now = new Date('2026-11-25T12:00:00Z');
  it.each([
    [null, 'source_checked', true],
    ['2026-11-01T12:00:00Z', 'source_checked', false],
    ['2026-10-20T12:00:00Z', 'source_checked', true],
    ['2026-11-20T12:00:00Z', 'needs_recheck', true],
  ])('last checked %s with %s → stale %s', (lastChecked, verification, expected) => {
    expect(isStale({ last_checked_at: lastChecked, verification_status: verification }, now)).toBe(
      expected,
    );
  });
});
