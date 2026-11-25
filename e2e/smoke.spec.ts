import { expect, test } from '@playwright/test';

test.describe('public site smoke tests', () => {
  test('home page loads with brand, heading and development notice', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RISE NETWORK/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Find legitimate opportunities',
    );
    await expect(page.getByRole('complementary', { name: /in development/i })).toBeVisible();
  });

  test('visitor can reach every primary section through the navigation', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    for (const label of ['Opportunities', 'Learning', 'Careers', 'About']) {
      if (isMobile) {
        await page.getByRole('button', { name: 'Menu' }).click();
      }
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: label })
        .click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(label);
    }
  });

  test('deep links work and unknown paths show the not-found page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy notice');
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });

  test('skip link is the first focusable element and moves focus to main content', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Keyboard navigation is verified on desktop only.');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to main content/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });

  test('layout has no horizontal overflow', async ({ page }) => {
    for (const path of ['/', '/about', '/opportunities', '/privacy']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });
});
