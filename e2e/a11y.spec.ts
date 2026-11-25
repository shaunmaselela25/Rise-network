import { test } from '@playwright/test';
import { expectNoA11yViolations } from './a11y';

const pages = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/opportunities',
  '/learning',
  '/careers',
  '/register',
  '/does-not-exist',
];

for (const path of pages) {
  test(`no detectable WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await expectNoA11yViolations(page, path);
  });
}
