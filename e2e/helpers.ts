import { expect, type Browser, type Page } from '@playwright/test';

/**
 * Integration-test helpers. The service-role key is read by the test process only; it is
 * never a VITE_ variable and so never reaches the browser bundle.
 */
export const apiUrl = process.env.VITE_SUPABASE_URL ?? '';
export const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const password = 'IntegrationTest123';

const adminHeaders = () => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
});

export async function createConfirmedUser(email: string, displayName: string): Promise<string> {
  const response = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        age_confirmed: true,
        terms_version: '0.1-draft',
        privacy_version: '0.1-draft',
      },
    }),
  });
  expect(response.ok, await response.clone().text()).toBe(true);
  return ((await response.json()) as { id: string }).id;
}

export async function grantRole(userId: string, role: 'moderator' | 'admin') {
  const response = await fetch(`${apiUrl}/rest/v1/user_roles`, {
    method: 'POST',
    headers: { ...adminHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: userId, role }),
  });
  expect(response.ok, await response.clone().text()).toBe(true);
}

export async function deleteUser(userId: string) {
  await fetch(`${apiUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
}

export async function signedInPage(browser: Browser, email: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/account$/);
  return page;
}
