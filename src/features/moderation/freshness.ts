/** D-06: published listings not checked within this many days need rechecking. */
export const FRESHNESS_DAYS = 30;

export function isStale(
  opportunity: { last_checked_at: string | null; verification_status: string },
  now: Date = new Date(),
): boolean {
  if (opportunity.verification_status === 'needs_recheck') return true;
  if (!opportunity.last_checked_at) return true;
  const ageMs = now.getTime() - new Date(opportunity.last_checked_at).getTime();
  return ageMs > FRESHNESS_DAYS * 86_400_000;
}
