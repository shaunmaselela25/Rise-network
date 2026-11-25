import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './a11y';
import { createConfirmedUser, deleteUser, grantRole, serviceKey, signedInPage } from './helpers';

/**
 * Phase 4 journey against the real local stack (FR-011, FR-012): staff create, publish and
 * edit learning resources and career guides; drafts stay private; members cannot manage.
 */

const runId = Date.now();
const userIds: string[] = [];
test.afterAll(async () => {
  for (const id of userIds) await deleteUser(id);
});

test('staff manage learning resources and career guides; the public sees only published', async ({
  browser,
  page: visitor,
}) => {
  test.skip(!serviceKey, 'SUPABASE_SERVICE_ROLE_KEY is required for this journey');
  const courseTitle = `Integration course ${runId}`;
  const guideTitle = `Integration guide ${runId}`;
  const guideSlug = `integration-guide-${runId}`;

  const memberEmail = `res-member-${runId}@example.com`;
  const staffEmail = `res-staff-${runId}@example.com`;
  userIds.push(await createConfirmedUser(memberEmail, 'Resource Member'));
  const staffId = await createConfirmedUser(staffEmail, 'Resource Staff');
  userIds.push(staffId);
  await grantRole(staffId, 'moderator');

  // Members cannot reach staff tools.
  const member = await signedInPage(browser, memberEmail);
  await member.goto('/staff/learning/new');
  await expect(member.getByRole('heading', { name: 'Not authorised' })).toBeVisible();
  await expect(
    member.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Staff' }),
  ).toHaveCount(0);

  // Staff create a learning resource as a draft.
  const staff = await signedInPage(browser, staffEmail);
  await staff
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Staff' })
    .click();
  await staff.getByRole('link', { name: 'Learning resources' }).click();
  await staff.getByRole('link', { name: 'Add a learning resource' }).click();
  await expectNoA11yViolations(staff, 'learning resource editor');
  await staff.getByRole('textbox', { name: 'Title' }).fill(courseTitle);
  await staff.getByRole('textbox', { name: 'Provider' }).fill('Example Learning');
  await staff
    .getByRole('textbox', { name: /link to the resource/i })
    .fill('https://example.org/integration/course');
  await staff
    .getByRole('textbox', { name: 'Description' })
    .fill('Spreadsheet basics for beginners.');
  await staff.getByRole('combobox', { name: 'Category' }).selectOption('digital_literacy');
  await staff.getByRole('combobox', { name: 'Format' }).selectOption('online_self_paced');
  await staff.getByRole('combobox', { name: 'Cost' }).selectOption('free');
  await staff.getByRole('button', { name: 'Save' }).click();
  await expect(staff).toHaveURL(/\/staff\/learning\?saved=1$/);
  await expect(staff.getByRole('row', { name: new RegExp(courseTitle) })).toContainText('Draft');

  // Draft is not public.
  await visitor.goto(`/learning?q=${encodeURIComponent(courseTitle)}`);
  await expect(visitor.getByText('0 resources found')).toBeVisible();

  // Staff publish it; the public can now find it with the right cost label.
  await staff.getByRole('link', { name: courseTitle }).click();
  await staff.getByRole('combobox', { name: 'Status' }).selectOption('published');
  await staff.getByRole('button', { name: 'Save' }).click();
  await expect(staff.getByRole('row', { name: new RegExp(courseTitle) })).toContainText(
    'Published',
  );

  await visitor.goto(`/learning?q=${encodeURIComponent(courseTitle)}&cost=free`);
  const card = visitor.getByRole('article', { name: courseTitle });
  await expect(card).toContainText('Free');
  await expect(
    card.getByRole('link', { name: new RegExp(`go to ${courseTitle}`, 'i') }),
  ).toHaveAttribute('href', 'https://example.org/integration/course');
  await expectNoA11yViolations(visitor, 'learning directory with results');
  await visitor.goto(`/learning?q=${encodeURIComponent(courseTitle)}&cost=paid`);
  await expect(visitor.getByText('0 resources found')).toBeVisible();

  // Career guide: slug suggested from the title, published, visible at its address.
  await staff.goto('/staff/careers/new');
  await staff.getByRole('textbox', { name: 'Title' }).fill(guideTitle);
  await expect(staff.getByRole('textbox', { name: /web address/i })).toHaveValue(guideSlug);
  await staff.getByRole('combobox', { name: 'Topic' }).selectOption('interview');
  await staff.getByRole('textbox', { name: 'Summary' }).fill('How to prepare for an interview.');
  await staff
    .getByRole('textbox', { name: /guide text/i })
    .fill('Research the organisation.\n\nPractise common questions.');
  await staff.getByRole('combobox', { name: 'Status' }).selectOption('published');
  await staff.getByRole('button', { name: 'Save' }).click();
  await expect(staff).toHaveURL(/\/staff\/careers\?saved=1$/);

  // Duplicate slug is refused with a clear message.
  await staff.goto('/staff/careers/new');
  await staff.getByRole('textbox', { name: 'Title' }).fill(guideTitle);
  await staff.getByRole('combobox', { name: 'Topic' }).selectOption('interview');
  await staff.getByRole('textbox', { name: 'Summary' }).fill('Duplicate.');
  await staff.getByRole('textbox', { name: /guide text/i }).fill('Duplicate.');
  await staff.getByRole('button', { name: 'Save' }).click();
  await expect(staff.getByRole('alert')).toContainText('already uses this web address');

  await visitor.goto('/careers');
  const interviews = visitor.getByRole('region', { name: 'Interviews' });
  await interviews.getByRole('link', { name: guideTitle }).click();
  await expect(visitor).toHaveURL(new RegExp(`/careers/${guideSlug}$`));
  await expect(visitor.getByRole('heading', { level: 1, name: guideTitle })).toBeVisible();
  await expect(visitor.getByText('Practise common questions.')).toBeVisible();
  await expectNoA11yViolations(visitor, 'career guide');

  // Archiving removes it from public view.
  await staff.goto('/staff/careers');
  await staff.getByRole('link', { name: guideTitle }).click();
  await staff.getByRole('combobox', { name: 'Status' }).selectOption('archived');
  await staff.getByRole('button', { name: 'Save' }).click();
  await visitor.goto(`/careers/${guideSlug}`);
  await expect(visitor.getByRole('heading', { name: 'Guide not found' })).toBeVisible();
});
