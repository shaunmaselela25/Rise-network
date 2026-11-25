import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from '../../test/renderRoute';
import { createMockSupabase, fakeSession } from '../../test/mockSupabase';

const mocks = vi.hoisted(() => ({ client: null as unknown }));

vi.mock('../../lib/supabase', () => ({
  getSupabase: () => mocks.client,
}));

let client: ReturnType<typeof createMockSupabase>;

function useClient(session: Parameters<typeof createMockSupabase>[0] = null) {
  client = createMockSupabase(session);
  mocks.client = client;
}

/** Renders a route and waits for its (lazily loaded) page heading. */
async function renderPage(path: string) {
  const utils = renderRoute(path);
  await screen.findByRole('heading', { level: 1 });
  return utils;
}

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:55321');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-test-anon-key');
  useClient();
});

describe('registration (FR-001)', () => {
  it('shows field errors and does not call the API when the form is incomplete', async () => {
    const { user } = await renderPage('/register');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('textbox', { name: /name to display/i })).toHaveAccessibleDescription(
      /enter the name/i,
    );
    expect(screen.getByRole('checkbox', { name: /18 years or older/i })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(client.auth.signUp).not.toHaveBeenCalled();
  });

  it('sends age confirmation and policy versions as sign-up metadata', async () => {
    const { user } = await renderPage('/register');
    await user.type(screen.getByRole('textbox', { name: /name to display/i }), 'Thandi');
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'thandi@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'abcdefghi1');
    await user.click(screen.getByRole('checkbox', { name: /18 years or older/i }));
    await user.click(screen.getByRole('checkbox', { name: /i accept the terms of use/i }));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'thandi@example.com',
      password: 'abcdefghi1',
      options: expect.objectContaining({
        data: {
          display_name: 'Thandi',
          age_confirmed: true,
          terms_version: '0.1-draft',
          privacy_version: '0.1-draft',
        },
      }),
    });
    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument();
  });

  it('shows a generic error when sign-up fails', async () => {
    client.auth.signUp.mockResolvedValueOnce({
      data: {},
      error: { code: 'unexpected_failure' },
    } as never);
    const { user } = await renderPage('/register');
    await user.type(screen.getByRole('textbox', { name: /name to display/i }), 'Thandi');
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'thandi@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'abcdefghi1');
    await user.click(screen.getByRole('checkbox', { name: /18 years or older/i }));
    await user.click(screen.getByRole('checkbox', { name: /i accept the terms of use/i }));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not create your account/i);
  });
});

describe('sign in (FR-002)', () => {
  async function signIn(path: string) {
    const utils = await renderPage(path);
    await utils.user.type(
      screen.getByRole('textbox', { name: /email address/i }),
      'thandi@example.com',
    );
    await utils.user.type(screen.getByLabelText(/^password/i), 'abcdefghi1');
    await utils.user.click(screen.getByRole('button', { name: 'Sign in' }));
    return utils;
  }

  it('shows a generic message that does not reveal whether the account exists', async () => {
    client.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { code: 'invalid_credentials' },
    } as never);
    await signIn('/sign-in');
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not sign you in/i);
  });

  it('redirects to the requested same-site page after sign-in', async () => {
    const { router } = await signIn('/sign-in?next=%2Fcareers');
    await waitFor(() => expect(router.state.location.pathname).toBe('/careers'));
  });

  it('ignores an external redirect target', async () => {
    const { router } = await signIn('/sign-in?next=%2F%2Fevil.example');
    await waitFor(() => expect(router.state.location.pathname).toBe('/account'));
  });
});

describe('password reset', () => {
  it('shows the same confirmation whatever the outcome', async () => {
    client.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: { code: 'user_not_found' },
    } as never);
    const { user } = await renderPage('/forgot-password');
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'nobody@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/if an account exists/i);
  });

  it('treats a reset link without a recovery session as invalid', async () => {
    await renderPage('/reset-password');
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or has expired/i);
  });
});

describe('protected account page', () => {
  it('redirects signed-out visitors to sign in, remembering where they were going', async () => {
    const { router } = renderRoute('/account');
    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
    expect(router.state.location.search).toBe('?next=%2Faccount');
  });

  it('shows the header sign-in link only when accounts are available', async () => {
    renderRoute('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(await within(nav).findByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('loads and saves the member profile (FR-013)', async () => {
    useClient(fakeSession());
    const { user } = await renderPage('/account');
    const name = await screen.findByRole('textbox', { name: /name to display/i });
    expect(name).toHaveValue('Thandi');
    expect(screen.getByRole('combobox', { name: /province/i })).toHaveValue('gauteng');

    await user.clear(name);
    await user.type(name, 'Thandi M');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(client.profileQuery.update).toHaveBeenCalledWith({
      display_name: 'Thandi M',
      province: 'gauteng',
      education_level: null,
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/profile has been saved/i);
  });

  it('requires explicit confirmation before deleting the account (FR-019)', async () => {
    useClient(fakeSession());
    const { user, router } = await renderPage('/account');
    const deleteButton = await screen.findByRole('button', { name: /delete my account/i });
    expect(deleteButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /deleting my account is permanent/i }));
    await user.click(deleteButton);

    expect(client.rpc).toHaveBeenCalledWith('delete_my_account');
    expect(client.auth.signOut).toHaveBeenCalled();
    await waitFor(() => expect(router.state.location.pathname).toBe('/account-deleted'));
  });

  it('shows the account link when signed in', async () => {
    useClient(fakeSession());
    renderRoute('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(await within(nav).findByRole('link', { name: 'My account' })).toBeInTheDocument();
  });
});
