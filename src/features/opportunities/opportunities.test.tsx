import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addDays, todaySast } from '../../lib/dates';
import { fakeSession } from '../../test/mockSupabase';
import { createQueryClient } from '../../test/mockQuery';
import { renderRoute } from '../../test/renderRoute';

const mocks = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('../../lib/supabase', () => ({ getSupabase: () => mocks.client }));

type Client = ReturnType<typeof createQueryClient>;
let client: Client;
function useClient(options: Parameters<typeof createQueryClient>[0]) {
  client = createQueryClient(options);
  mocks.client = client;
}

const today = todaySast();
const categories = {
  data: [{ code: 'engineering', label: 'Engineering', sort_order: 1 }],
  error: null,
};

function opportunity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    slug: 'engineering-bursary-a1b2c3d4',
    title: 'Engineering bursary',
    summary: 'Full bursary for engineering students.',
    description: 'Covers tuition.\nAnd accommodation.',
    opportunity_type: 'bursary',
    category_code: 'engineering',
    provider_name: 'Example Foundation',
    provider_url: null,
    source_url: 'https://example.org/source',
    application_url: 'https://example.org/apply',
    application_instructions: null,
    location_text: null,
    province: 'gauteng',
    municipality: null,
    delivery_mode: 'in_person',
    eligibility: 'South African citizens.',
    required_documents: null,
    required_skills: null,
    min_qualification: 'matric',
    age_min: null,
    age_max: null,
    opens_at: null,
    closes_at: addDays(today, 20),
    duration_text: null,
    financial_details: null,
    contact_info: null,
    verification_status: 'source_checked',
    last_checked_at: '2026-11-20T10:00:00Z',
    published_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:00:00Z',
    is_closed: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:55321');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-test-anon-key');
});

describe('opportunity directory (FR-003, FR-004, FR-005)', () => {
  it('lists active published opportunities with source-backed labels', async () => {
    useClient({
      tables: {
        opportunity_categories: categories,
        public_opportunities: { data: [opportunity()], error: null, count: 1 },
      },
    });
    renderRoute('/opportunities');

    expect(await screen.findByText('1 opportunity found')).toBeInTheDocument();
    const card = screen.getByRole('article', { name: 'Engineering bursary' });
    expect(within(card).getByRole('link', { name: 'Engineering bursary' })).toHaveAttribute(
      'href',
      '/opportunities/engineering-bursary-a1b2c3d4',
    );
    expect(within(card).getByText('Source checked')).toBeInTheDocument();
    expect(within(card).getByText(/20 days left/)).toBeInTheDocument();
    // Closed listings are excluded by default (BR-03).
    expect(client.callsTo('public_opportunities', 'eq')).toContainEqual(['is_closed', false]);
  });

  it('turns URL filters into server-side query conditions', async () => {
    useClient({
      tables: {
        opportunity_categories: categories,
        public_opportunities: { data: [], error: null, count: 0 },
      },
    });
    renderRoute('/opportunities?q=data+science&province=limpopo&qualification=matric&closed=1');
    await screen.findByText('0 opportunities found');

    expect(client.callsTo('public_opportunities', 'textSearch')[0]).toEqual([
      'search_vector',
      'data science',
      { type: 'websearch', config: 'english' },
    ]);
    expect(client.callsTo('public_opportunities', 'eq')).toContainEqual(['province', 'limpopo']);
    expect(client.callsTo('public_opportunities', 'or')).toContainEqual([
      'min_qualification.is.null,min_qualification.in.(none,grade_9,matric)',
    ]);
    expect(client.callsTo('public_opportunities', 'eq')).not.toContainEqual(['is_closed', false]);
  });

  it('shows a helpful empty state with a way to clear filters', async () => {
    useClient({
      tables: {
        opportunity_categories: categories,
        public_opportunities: { data: [], error: null, count: 0 },
      },
    });
    const { user, router } = renderRoute('/opportunities?province=gauteng');
    expect(await screen.findByText(/no opportunities match/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear all filters/i }));
    expect(router.state.location.search).toBe('');
  });

  it('shows an error with retry instead of raw database errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useClient({
      tables: {
        opportunity_categories: categories,
        public_opportunities: { data: null, error: { code: 'XX000', message: 'relation secret' } },
      },
    });
    renderRoute('/opportunities');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not load opportunities/i);
    expect(alert).not.toHaveTextContent(/relation secret/);
    expect(within(alert).getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('opportunity detail (FR-006)', () => {
  it('shows source, verification explanation and a safe apply link', async () => {
    useClient({ tables: { public_opportunities: { data: [opportunity()], error: null } } });
    renderRoute('/opportunities/engineering-bursary-a1b2c3d4');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Engineering bursary' }),
    ).toBeInTheDocument();
    const apply = screen.getByRole('link', { name: /apply on the provider/i });
    expect(apply).toHaveAttribute('href', 'https://example.org/apply');
    expect(apply).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.getByText(/checked these details against the provider’s official source/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /official information/i })).toHaveAttribute(
      'href',
      'https://example.org/source',
    );
    expect(screen.getByText(/cannot guarantee selection/i)).toBeInTheDocument();
  });

  it('marks closed opportunities and removes the apply action (BR-03)', async () => {
    useClient({
      tables: {
        public_opportunities: {
          data: [opportunity({ closes_at: addDays(today, -1), is_closed: true })],
          error: null,
        },
      },
    });
    renderRoute('/opportunities/engineering-bursary-a1b2c3d4');
    expect(await screen.findByText(/this opportunity has closed/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /apply on the provider/i })).not.toBeInTheDocument();
  });

  it('never renders a non-https application link', async () => {
    useClient({
      tables: {
        public_opportunities: {
          data: [opportunity({ application_url: 'javascript:alert(1)' })],
          error: null,
        },
      },
    });
    renderRoute('/opportunities/engineering-bursary-a1b2c3d4');
    await screen.findByRole('heading', { level: 1, name: 'Engineering bursary' });
    expect(screen.queryByRole('link', { name: /apply on the provider/i })).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it('shows a not-found message for unknown or unpublished slugs', async () => {
    useClient({ tables: { public_opportunities: { data: [], error: null } } });
    renderRoute('/opportunities/missing');
    expect(
      await screen.findByRole('heading', { name: /opportunity not found/i }),
    ).toBeInTheDocument();
  });

  it('asks visitors to sign in to save or report', async () => {
    useClient({ tables: { public_opportunities: { data: [opportunity()], error: null } } });
    renderRoute('/opportunities/engineering-bursary-a1b2c3d4');
    expect(await screen.findByRole('link', { name: /sign in to save/i })).toHaveAttribute(
      'href',
      '/sign-in?next=%2Fopportunities%2Fengineering-bursary-a1b2c3d4',
    );
  });

  it('lets a member save an opportunity (FR-007)', async () => {
    useClient({
      session: fakeSession(),
      tables: {
        public_opportunities: { data: [opportunity()], error: null },
        saved_opportunities: { data: [], error: null },
        user_roles: { data: [], error: null },
      },
    });
    const { user } = renderRoute('/opportunities/engineering-bursary-a1b2c3d4');
    const save = await screen.findByRole('button', { name: 'Save' });
    expect(save).toHaveAttribute('aria-pressed', 'false');
    await user.click(save);
    expect(client.callsTo('saved_opportunities', 'insert')).toContainEqual([
      { opportunity_id: 'a1b2c3d4-0000-0000-0000-000000000001' },
    ]);
    expect(await screen.findByRole('button', { name: /saved — remove/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('submitting an opportunity (FR-008)', () => {
  it('validates before sending and never sends status or verification fields', async () => {
    useClient({
      session: fakeSession(),
      tables: {
        opportunity_categories: categories,
        user_roles: { data: [], error: null },
        opportunities: { data: [{ id: 'new-id' }], error: null },
      },
    });
    const { user, router } = renderRoute('/submit');
    await screen.findByRole('heading', { level: 1, name: /submit an opportunity/i });

    await user.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(await screen.findByText(/correct the highlighted fields/i)).toBeInTheDocument();
    expect(client.callsTo('opportunities', 'insert')).toHaveLength(0);

    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Engineering bursary 2027');
    await user.type(screen.getByRole('textbox', { name: 'Short summary' }), 'Full bursary.');
    await user.type(screen.getByRole('textbox', { name: 'Full description' }), 'Details.');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'bursary');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Field' }), 'engineering');
    await user.type(
      screen.getByRole('textbox', { name: 'Organisation offering it' }),
      'Example Foundation',
    );
    await user.type(
      screen.getByRole('textbox', { name: /where did you find this information/i }),
      'https://example.org/bursary',
    );
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/my-submissions'));
    const [payload] = client.callsTo('opportunities', 'insert')[0] as [Record<string, unknown>];
    expect(payload).toMatchObject({
      title: 'Engineering bursary 2027',
      status: 'pending_review',
      source_url: 'https://example.org/bursary',
      application_url: null,
    });
    for (const forbidden of ['verification_status', 'published_at', 'submitted_by', 'slug']) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });
});
