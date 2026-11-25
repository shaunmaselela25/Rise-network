import { describe, expect, it } from 'vitest';
import {
  defaultFilters,
  filtersToParams,
  hasActiveFilters,
  parseFilters,
  qualifyingLevels,
} from './filters';

describe('parseFilters', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(defaultFilters);
  });

  it('parses valid values', () => {
    expect(
      parseFilters(
        new URLSearchParams(
          'q=engineering&type=bursary&category=ict&province=gauteng&qualification=matric&closing=30&closed=1&sort=newest&page=3',
        ),
      ),
    ).toEqual({
      q: 'engineering',
      type: 'bursary',
      category: 'ict',
      province: 'gauteng',
      qualification: 'matric',
      closing: '30',
      includeClosed: true,
      sort: 'newest',
      page: 3,
    });
  });

  it('falls back to defaults for tampered values instead of passing them to queries', () => {
    const filters = parseFilters(
      new URLSearchParams(
        'type=hacker&category=ict),or(1.eq.1&province=mars&closing=999&sort=drop&page=-4&qualification=phd',
      ),
    );
    expect(filters).toEqual(defaultFilters);
  });

  it('limits search text length', () => {
    expect(parseFilters(new URLSearchParams(`q=${'a'.repeat(101)}`)).q).toBe('');
  });
});

describe('filtersToParams', () => {
  it('omits default values', () => {
    expect(filtersToParams(defaultFilters).toString()).toBe('');
  });

  it('round-trips through parseFilters', () => {
    const filters = {
      ...defaultFilters,
      q: 'data science',
      province: 'limpopo' as const,
      includeClosed: true,
      page: 2,
    };
    expect(parseFilters(filtersToParams(filters))).toEqual(filters);
  });
});

describe('qualifyingLevels', () => {
  it('includes the selected level and everything below it', () => {
    expect(qualifyingLevels('matric')).toEqual(['none', 'grade_9', 'matric']);
    expect(qualifyingLevels('none')).toEqual(['none']);
  });
});

describe('hasActiveFilters', () => {
  it('ignores sort order and page', () => {
    expect(hasActiveFilters({ ...defaultFilters, sort: 'newest', page: 4 })).toBe(false);
    expect(hasActiveFilters({ ...defaultFilters, province: 'gauteng' })).toBe(true);
  });
});
