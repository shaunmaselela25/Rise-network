import { describe, expect, it } from 'vitest';
import { addDays, deadlineState, deadlineText, formatDate, todaySast } from './dates';

describe('todaySast', () => {
  it('uses South African time, not UTC', () => {
    // 23:30 UTC on 24 Nov is 01:30 on 25 Nov in South Africa (UTC+2).
    expect(todaySast(new Date('2026-11-24T23:30:00Z'))).toBe('2026-11-25');
    expect(todaySast(new Date('2026-11-24T21:59:00Z'))).toBe('2026-11-24');
  });
});

describe('addDays', () => {
  it('handles month and year boundaries', () => {
    expect(addDays('2026-11-25', 7)).toBe('2026-12-02');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
});

describe('deadlineState (BR-03)', () => {
  const today = '2026-11-25';
  it.each([
    [null, { kind: 'rolling' }],
    ['2026-11-24', { kind: 'closed' }],
    ['2026-11-25', { kind: 'closes_today' }],
    ['2026-11-26', { kind: 'open', daysLeft: 1 }],
    ['2026-12-25', { kind: 'open', daysLeft: 30 }],
  ])('closing date %s → %o', (closesAt, expected) => {
    expect(deadlineState(closesAt, today)).toEqual(expected);
  });

  it('describes deadlines in plain language', () => {
    expect(deadlineText(null, today)).toBe('No fixed closing date');
    expect(deadlineText('2026-11-24', today)).toBe('Closed on 24 November 2026');
    expect(deadlineText('2026-11-25', today)).toBe('Closes today');
    expect(deadlineText('2026-11-26', today)).toBe('Closes 26 November 2026 (1 day left)');
  });
});

describe('formatDate', () => {
  it('does not shift date-only values across time zones', () => {
    expect(formatDate('2026-01-01')).toBe('1 January 2026');
  });
});
