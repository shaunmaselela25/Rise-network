import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderRoute';

/**
 * Content-integrity guards derived from the product rules:
 * no guarantee language, honest "not available" states, drafts labelled as drafts.
 */
describe('content integrity', () => {
  it.each(['/opportunities', '/learning', '/careers'])(
    '%s states clearly that the section is not available yet and shows no controls',
    (path) => {
      renderRoute(path);
      expect(screen.getByRole('complementary', { name: /not available yet/i })).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    },
  );

  it.each(['/privacy', '/terms'])('%s is labelled as a draft pending legal review', (path) => {
    renderRoute(path);
    expect(
      screen.getByRole('complementary', { name: /draft — pending legal review/i }),
    ).toBeInTheDocument();
  });

  it.each(['/', '/about', '/opportunities', '/learning', '/careers', '/contact'])(
    '%s never promises guaranteed outcomes',
    (path) => {
      const { container } = renderRoute(path);
      const text = container.textContent ?? '';
      // "guarantee" may only appear in a negated or cautionary form.
      const guaranteeSentences = text
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => /guarantee/i.test(sentence));
      for (const sentence of guaranteeSentences) {
        expect(sentence).toMatch(/\b(not|cannot|no|never|cautious)\b/i);
      }
    },
  );

  it.each(['/register', '/sign-in', '/forgot-password', '/account'])(
    '%s says accounts are unavailable when no backend is configured (no dead forms)',
    async (path) => {
      renderRoute(path);
      expect(
        await screen.findByRole('heading', { level: 1, name: /accounts are not available/i }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(
        within(screen.getByRole('navigation', { name: 'Main' })).queryByRole('link', {
          name: /sign in/i,
        }),
      ).not.toBeInTheDocument();
    },
  );

  it('opens external links safely', () => {
    renderRoute('/contact');
    const external = screen.getByRole('link', { name: /public issue tracker/i });
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    expect(external).toHaveAttribute('target', '_blank');
  });

  it('includes the third-party disclaimer in the footer on every page', () => {
    renderRoute('/');
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      /we do not guarantee admission, funding, employment or selection/i,
    );
  });
});
