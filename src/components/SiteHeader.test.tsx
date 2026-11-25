import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderRoute';

describe('SiteHeader mobile menu', () => {
  it('toggles aria-expanded and is linked to the navigation it controls', async () => {
    const { user } = renderRoute('/');
    const button = screen.getByRole('button', { name: 'Menu' });
    const nav = screen.getByRole('navigation', { name: 'Main' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', nav.id);

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes when Escape is pressed', async () => {
    const { user } = renderRoute('/');
    const button = screen.getByRole('button', { name: 'Menu' });
    await user.click(button);
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes after navigating to another page', async () => {
    const { user } = renderRoute('/');
    const button = screen.getByRole('button', { name: 'Menu' });
    await user.click(button);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'Careers' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
