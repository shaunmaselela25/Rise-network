import { describe, expect, it } from 'vitest';
import { formatPageTitle } from './usePageTitle';

describe('formatPageTitle', () => {
  it('returns the brand and tagline when no page title is given', () => {
    expect(formatPageTitle()).toBe('RISE NETWORK — Opportunity. Access. Progress.');
  });

  it('prefixes the page title before the brand', () => {
    expect(formatPageTitle('About')).toBe('About | RISE NETWORK');
  });
});
