import { expect, test, type Page } from '@playwright/test';

/**
 * Critical journeys 4, 5 and 12 (docs/PRODUCT_REQUIREMENTS.md): register, confirm, sign in,
 * manage profile, sign out, delete account — against a real Supabase Auth + Postgres stack.
 */

const mailpit = process.env.MAILPIT_URL ?? '';
const password = 'IntegrationTest123';

async function confirmationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await fetch(
      `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    const first = messages[0];
    if (first) {
      const message = (await (await fetch(`${mailpit}/api/v1/message/${first.ID}`)).json()) as {
        Text: string;
        HTML: string;
      };
      const match = (message.Text + message.HTML).match(/https?:\/\/[^\s"'<>]+verify[^\s"'<>]+/);
      if (match) return match[0].replaceAll('&amp;', '&');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No confirmation email received for ${email}`);
}

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('member registers, confirms email, manages profile and deletes account', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  // Visitor cannot reach the account page.
  await page.goto('/account');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount$/);

  // Register (18+ and policy acceptance required).
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Name to display' }).fill('E2E Member');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('checkbox', { name: /18 years or older/ }).check();
  await page.getByRole('checkbox', { name: /I accept the terms of use/ }).check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

  // Unconfirmed accounts cannot sign in.
  await signIn(page, email);
  await expect(page.getByRole('alert')).toContainText('could not sign you in');

  // Confirm via the emailed link, then sign in.
  await page.goto(await confirmationLink(email));
  await signIn(page, email);
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

  // Profile was created by the database sign-up hook and can be edited.
  const name = page.getByRole('textbox', { name: 'Name to display' });
  await expect(name).toHaveValue('E2E Member');
  await name.fill('E2E Member Updated');
  await page.getByRole('combobox', { name: 'Province' }).selectOption('limpopo');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('status')).toContainText('profile has been saved');

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Name to display' })).toHaveValue(
    'E2E Member Updated',
  );
  await expect(page.getByRole('combobox', { name: 'Province' })).toHaveValue('limpopo');

  // Sign out and back in.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sign in' }),
  ).toBeVisible();
  await signIn(page, email);
  await expect(page).toHaveURL(/\/account$/);

  // Delete account (requires explicit confirmation).
  const deleteButton = page.getByRole('button', { name: 'Delete my account' });
  await expect(deleteButton).toBeDisabled();
  await page.getByRole('checkbox', { name: /deleting my account is permanent/ }).check();
  await deleteButton.click();
  await expect(page).toHaveURL(/\/account-deleted$/);

  // The deleted account can no longer sign in.
  await signIn(page, email);
  await expect(page.getByRole('alert')).toContainText('could not sign you in');
});
