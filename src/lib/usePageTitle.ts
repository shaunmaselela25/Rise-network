import { useEffect } from 'react';

export const SITE_NAME = 'RISE NETWORK';

export function formatPageTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Opportunity. Access. Progress.`;
}

/** Sets document.title for the current page. */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = formatPageTitle(title);
  }, [title]);
}
