import { expect, test, type Page } from '@playwright/test';
import { expectNoA11yViolations } from './a11y';
import { createConfirmedUser, deleteUser, grantRole, serviceKey, signedInPage } from './helpers';

/**
 * Critical journeys 1–3 and 6–11 (docs/PRODUCT_REQUIREMENTS.md) against the real local stack:
 * submit → refused unverified publish → verified publish → public search → save/track →
 * report → resolve. Test accounts are created with the Auth admin API (service key is held
 * by the test process only and is not a VITE_ variable, so it never reaches the bundle).
 */

const runId = Date.now();

async function search(page: Page, text: string) {
  await page.goto('/opportunities');
  await page.getByRole('searchbox', { name: 'Search' }).fill(text);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
}

const userIds: string[] = [];
test.afterAll(async () => {
  for (const id of userIds) await deleteUser(id);
});

test('opportunity lifecycle: submit, moderate, discover, save, report, resolve', async ({
  browser,
  page: visitor,
}) => {
  test.skip(!serviceKey, 'SUPABASE_SERVICE_ROLE_KEY is required for this journey');
  const title = `Integration bursary ${runId}`;
  const memberEmail = `member-${runId}@example.com`;
  const moderatorEmail = `moderator-${runId}@example.com`;
  userIds.push(await createConfirmedUser(memberEmail, 'Integration Member'));
  const moderatorId = await createConfirmedUser(moderatorEmail, 'Integration Moderator');
  userIds.push(moderatorId);
  await grantRole(moderatorId, 'moderator');

  // 1. Member submits an opportunity (FR-008).
  const member = await signedInPage(browser, memberEmail);
  await member.goto('/submit');
  await expectNoA11yViolations(member, 'submit form');
  await member.getByRole('textbox', { name: 'Title' }).fill(title);
  await member.getByRole('textbox', { name: 'Short summary' }).fill('Full engineering bursary.');
  await member.getByRole('textbox', { name: 'Full description' }).fill('Covers tuition and books.');
  await member.getByRole('combobox', { name: 'Type' }).selectOption('bursary');
  await member.getByRole('combobox', { name: 'Field' }).selectOption('engineering');
  await member
    .getByRole('textbox', { name: 'Organisation offering it' })
    .fill('Example Foundation');
  await member
    .getByRole('textbox', { name: /where did you find this information/i })
    .fill('https://example.org/integration/source');
  await member
    .getByRole('textbox', { name: /application link/i })
    .fill('https://example.org/integration/apply');
  await member.getByRole('combobox', { name: /^province/i }).selectOption('gauteng');
  await member.getByRole('button', { name: 'Submit for review' }).click();
  await expect(member).toHaveURL(/\/my-submissions\?saved=submit$/);
  await expect(member.getByRole('row', { name: new RegExp(title) })).toContainText(
    'Waiting for review',
  );

  // 2. Not public before review.
  await search(visitor, title);
  await expect(visitor.getByText('0 opportunities found')).toBeVisible();

  // 3. Member cannot open moderation (UI) — database authorisation is covered by pgTAP.
  await member.goto('/moderation');
  await expect(member.getByRole('heading', { name: 'Not authorised' })).toBeVisible();

  // 4. Moderator: publishing unverified is refused (D-02); verified publish succeeds.
  const moderator = await signedInPage(browser, moderatorEmail);
  await moderator.goto('/moderation');
  await moderator.getByRole('link', { name: title }).click();
  await moderator.getByRole('button', { name: 'Publish' }).click();
  await expect(moderator.getByRole('alert')).toContainText('Verify the source');
  await expectNoA11yViolations(moderator, 'moderation review page');
  await moderator
    .getByRole('combobox', { name: /verification status/i })
    .selectOption('source_checked');
  await moderator.getByRole('textbox', { name: /^note/i }).fill('Checked against provider site');
  await moderator.getByRole('button', { name: 'Publish' }).click();
  await expect(moderator.getByText('Published. The listing is now public.')).toBeVisible();

  // 5. Visitor discovers it via search and filters (FR-003–FR-006).
  await search(visitor, title);
  await expect(visitor.getByText('1 opportunity found')).toBeVisible();
  await expectNoA11yViolations(visitor, 'directory with results');
  await visitor.goto(`/opportunities?q=${encodeURIComponent(title)}&province=western_cape`);
  await expect(visitor.getByText('0 opportunities found')).toBeVisible();
  await visitor.goto(`/opportunities?q=${encodeURIComponent(title)}&province=gauteng`);
  await visitor.getByRole('link', { name: title }).click();
  await expect(visitor.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(visitor.getByRole('link', { name: /apply on the provider/i })).toHaveAttribute(
    'href',
    'https://example.org/integration/apply',
  );
  await expect(visitor.getByText('Source checked', { exact: true })).toBeVisible();
  await expectNoA11yViolations(visitor, 'opportunity detail');
  const detailUrl = visitor.url();

  // 6. Member saves and tracks progress (FR-007).
  await member.goto(detailUrl);
  await member.getByRole('button', { name: 'Save' }).click();
  await expect(member.getByRole('button', { name: /saved — remove/i })).toBeVisible();
  await member.goto('/saved');
  await member
    .getByRole('combobox', { name: new RegExp(`progress for ${title}`, 'i') })
    .selectOption('applied');
  await expect(member.getByText('Progress updated.')).toBeVisible();
  await expectNoA11yViolations(member, 'saved opportunities');
  await member.reload();
  await expect(
    member.getByRole('combobox', { name: new RegExp(`progress for ${title}`, 'i') }),
  ).toHaveValue('applied');

  // 7. Member reports the listing; moderator resolves it (FR-014, FR-015).
  await member.goto(detailUrl);
  await member.getByText('Report this listing').click();
  await member.getByRole('combobox', { name: 'What is wrong?' }).selectOption('incorrect');
  await member.getByRole('textbox', { name: /^details/i }).fill('Closing date differs');
  await member.getByRole('button', { name: 'Send report' }).click();
  await expect(member.getByText('A moderator will review your report.')).toBeVisible();

  await moderator.goto('/moderation?tab=reports');
  const reportCard = moderator.getByRole('article', { name: `Report on ${title}` });
  await expect(reportCard).toContainText('Closing date differs');
  await reportCard.getByRole('combobox', { name: 'Outcome' }).selectOption('actioned');
  await reportCard.getByRole('button', { name: 'Resolve report' }).click();
  await expect(reportCard).toHaveCount(0);
});

test('the browser bundle does not contain the service-role key', async ({ page }) => {
  test.skip(!serviceKey, 'SUPABASE_SERVICE_ROLE_KEY is required for this check');
  await page.goto('/');
  const scripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]')).map((s) => (s as HTMLScriptElement).src),
  );
  const assets = new Set(scripts);
  // Also fetch lazily loaded chunks referenced by the entry module.
  for (const src of scripts) {
    const body = await (await fetch(src)).text();
    for (const match of body.matchAll(/assets\/[\w-]+\.js/g)) {
      assets.add(new URL(`/${match[0]}`, src).href);
    }
  }
  expect(assets.size).toBeGreaterThan(1);
  for (const asset of assets) {
    const body = await (await fetch(asset)).text();
    expect(body, `service key found in ${asset}`).not.toContain(serviceKey);
  }
});
