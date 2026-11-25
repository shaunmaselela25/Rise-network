import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession } from '../../test/mockSupabase';
import { createQueryClient } from '../../test/mockQuery';
import { renderRoute } from '../../test/renderRoute';

const mocks = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('../../lib/supabase', () => ({ getSupabase: () => mocks.client }));

let client: ReturnType<typeof createQueryClient>;
function useClient(options: Parameters<typeof createQueryClient>[0]) {
  client = createQueryClient(options);
  mocks.client = client;
}

const learningCategories = {
  data: [{ code: 'digital_literacy', label: 'Digital literacy', sort_order: 1, is_active: true }],
  error: null,
};

const course = {
  id: 'l1',
  title: 'Intro to spreadsheets',
  description: 'Learn the basics.',
  provider_name: 'Example Learning',
  category_code: 'digital_literacy',
  level: 'beginner',
  format: 'online_self_paced',
  cost: 'funded',
  duration_text: '4 weeks',
  requirements: null,
  url: 'https://example.org/course',
  last_reviewed_at: '2026-11-20T10:00:00Z',
};

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:55321');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-test-anon-key');
});

describe('learning directory (FR-011)', () => {
  it('lists only published resources with factual cost labels and safe links', async () => {
    useClient({
      tables: {
        learning_categories: learningCategories,
        learning_resources: { data: [course], error: null, count: 1 },
      },
    });
    renderRoute('/learning');
    const card = await screen.findByRole('article', { name: 'Intro to spreadsheets' });
    expect(within(card).getByText('Funding available')).toBeInTheDocument();
    expect(within(card).getByText(/Digital literacy · Beginner/)).toBeInTheDocument();
    const link = within(card).getByRole('link', { name: /go to intro to spreadsheets/i });
    expect(link).toHaveAttribute('href', 'https://example.org/course');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(client.callsTo('learning_resources', 'eq')).toContainEqual(['status', 'published']);
    expect(screen.getByText(/does not\s+accredit courses/i)).toBeInTheDocument();
  });

  it('matches search text literally (LIKE wildcards escaped) and applies filters', async () => {
    useClient({
      tables: {
        learning_categories: learningCategories,
        learning_resources: { data: [], error: null, count: 0 },
      },
    });
    renderRoute('/learning?q=100%25_off&cost=free&level=beginner');
    expect(await screen.findByText(/no learning resources match/i)).toBeInTheDocument();
    // '%' and '_' typed by the user are escaped so they match literally.
    expect(client.callsTo('learning_resources', 'ilike')).toEqual([
      ['title', String.raw`%100\%\_off%`],
    ]);
    const eqCalls = client.callsTo('learning_resources', 'eq');
    expect(eqCalls).toContainEqual(['cost', 'free']);
    expect(eqCalls).toContainEqual(['level', 'beginner']);
  });
});

describe('career guides (FR-012)', () => {
  it('groups published guides by topic', async () => {
    useClient({
      tables: {
        career_resources: {
          data: [
            {
              id: 'c1',
              slug: 'writing-your-cv',
              title: 'Writing your CV',
              summary: 'A guide.',
              topic: 'cv',
              external_url: null,
              last_reviewed_at: null,
            },
          ],
          error: null,
        },
      },
    });
    renderRoute('/careers');
    const section = await screen.findByRole('region', { name: 'CVs and applications' });
    expect(within(section).getByRole('link', { name: 'Writing your CV' })).toHaveAttribute(
      'href',
      '/careers/writing-your-cv',
    );
  });

  it('renders guide text as plain text, never as HTML', async () => {
    useClient({
      tables: {
        career_resources: {
          data: [
            {
              id: 'c1',
              slug: 'writing-your-cv',
              title: 'Writing your CV',
              summary: 'A guide.',
              body: 'Start here.\n\n<img src=x onerror=alert(1)>',
              topic: 'cv',
              external_url: null,
              status: 'published',
              last_reviewed_at: null,
            },
          ],
          error: null,
        },
      },
    });
    renderRoute('/careers/writing-your-cv');
    expect(await screen.findByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });
});

describe('content management (staff only)', () => {
  it('does not show management screens to members', async () => {
    useClient({ session: fakeSession(), tables: { user_roles: { data: [], error: null } } });
    renderRoute('/staff/learning/new');
    expect(await screen.findByRole('heading', { name: /not authorised/i })).toBeInTheDocument();
  });

  it('lets staff create a learning resource with a review date when published', async () => {
    useClient({
      session: fakeSession(),
      tables: {
        user_roles: { data: [{ role: 'moderator' }], error: null },
        learning_categories: learningCategories,
        learning_resources: { data: [{ id: 'new' }], error: null },
      },
    });
    const { user, router } = renderRoute('/staff/learning/new');
    await screen.findByRole('heading', { level: 1, name: /add a learning resource/i });
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Intro to spreadsheets');
    await user.type(screen.getByRole('textbox', { name: 'Provider' }), 'Example Learning');
    await user.type(
      screen.getByRole('textbox', { name: /link to the resource/i }),
      'https://example.org/course',
    );
    await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Learn the basics.');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Category' }),
      'digital_literacy',
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Format' }), 'online_self_paced');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'published');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/staff/learning'));
    const [payload] = client.callsTo('learning_resources', 'insert')[0] as [
      Record<string, unknown>,
    ];
    expect(payload).toMatchObject({
      title: 'Intro to spreadsheets',
      status: 'published',
      cost: 'unknown',
      level: 'all_levels',
      url: 'https://example.org/course',
    });
    expect(typeof payload.last_reviewed_at).toBe('string');
  });

  it('suggests a slug from the career guide title', async () => {
    useClient({
      session: fakeSession(),
      tables: { user_roles: { data: [{ role: 'admin' }], error: null } },
    });
    const { user } = renderRoute('/staff/careers/new');
    await screen.findByRole('heading', { level: 1, name: /add a career guide/i });
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Preparing for interviews!');
    expect(screen.getByRole('textbox', { name: /web address/i })).toHaveValue(
      'preparing-for-interviews',
    );
  });
});
