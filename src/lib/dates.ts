const SA_TIME_ZONE = 'Africa/Johannesburg';

/** Today's calendar date in South Africa as YYYY-MM-DD (matches private.today_sast()). */
export function todaySast(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Whole days from `today` until `isoDate` (negative when in the past). */
export function daysBetween(today: string, isoDate: string): number {
  const ms = Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** e.g. "25 November 2026". Date-only values are formatted without time-zone shifts. */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** e.g. "25 November 2026" for a timestamp, in South African time. */
export function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: SA_TIME_ZONE,
  }).format(new Date(timestamp));
}

export type DeadlineState =
  | { kind: 'rolling' }
  | { kind: 'closed' }
  | { kind: 'closes_today' }
  | { kind: 'open'; daysLeft: number };

/** Deadline status. A listing closes at the end of its closing date (inclusive), SAST. */
export function deadlineState(closesAt: string | null, today: string = todaySast()): DeadlineState {
  if (!closesAt) return { kind: 'rolling' };
  const days = daysBetween(today, closesAt);
  if (days < 0) return { kind: 'closed' };
  if (days === 0) return { kind: 'closes_today' };
  return { kind: 'open', daysLeft: days };
}

export function deadlineText(closesAt: string | null, today: string = todaySast()): string {
  const state = deadlineState(closesAt, today);
  switch (state.kind) {
    case 'rolling':
      return 'No fixed closing date';
    case 'closed':
      return `Closed on ${formatDate(closesAt as string)}`;
    case 'closes_today':
      return 'Closes today';
    case 'open':
      return `Closes ${formatDate(closesAt as string)} (${state.daysLeft} ${
        state.daysLeft === 1 ? 'day' : 'days'
      } left)`;
  }
}
