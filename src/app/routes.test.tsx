import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RouteObject } from 'react-router';
import { renderRoute } from '../test/renderRoute';
import { footerNav, primaryNav } from './navigation';
import { Layout } from './Layout';
import { RouteErrorPage } from './RouteErrorPage';

const expectedHeadings: Record<string, RegExp> = {
  '/': /find legitimate opportunities/i,
  '/opportunities': /^opportunities$/i,
  '/learning': /^learning$/i,
  '/careers': /^careers$/i,
  '/about': /about rise network/i,
  '/contact': /^contact$/i,
  '/privacy': /privacy notice/i,
  '/terms': /terms of use/i,
};

describe('routing', () => {
  it.each(Object.entries(expectedHeadings))('renders %s with its page heading', (path, heading) => {
    renderRoute(path);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('has no dead navigation links: every nav target has its own page', () => {
    const targets = new Set([...primaryNav, ...footerNav].map((item) => item.to));
    for (const target of targets) {
      expect(expectedHeadings, `missing route test for ${target}`).toHaveProperty(target);
    }
  });

  it('shows a not-found page for unknown paths', () => {
    renderRoute('/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to the home page/i })).toHaveAttribute('href', '/');
  });

  it('sets the document title per page', async () => {
    renderRoute('/about');
    await waitFor(() => expect(document.title).toBe('About | RISE NETWORK'));
  });

  it('navigates between pages using the main navigation', async () => {
    const { user, router } = renderRoute('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Learning' }));
    expect(router.state.location.pathname).toBe('/learning');
    expect(screen.getByRole('heading', { level: 1, name: /^learning$/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Learning' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('moves focus to the main content after navigation', async () => {
    const { user } = renderRoute('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'About' }));
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('provides a skip link to the main content', () => {
    renderRoute('/');
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('shows a safe generic error page when a route throws, without technical details', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Boom(): never {
      throw new Error('database password is hunter2');
    }
    const table: RouteObject[] = [
      {
        path: '/',
        element: <Layout />,
        errorElement: <RouteErrorPage />,
        children: [{ index: true, element: <Boom /> }],
      },
    ];
    renderRoute('/', table);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.queryByText(/hunter2/)).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});
