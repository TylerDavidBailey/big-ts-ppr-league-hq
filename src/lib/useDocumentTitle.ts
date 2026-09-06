import { useEffect } from 'react';

import { LEAGUE } from '@/league.config';

/** The browser tab and history entry, so a bookmark names its page. */
export function documentTitle(...parts: (string | undefined | null)[]): string {
  return [...parts.filter(Boolean), LEAGUE.name].join(' · ');
}

/**
 * Set the document title for the route, restoring the previous one on
 * unmount so the static title from `index.html` survives a route that sets
 * none.
 */
export function useDocumentTitle(...parts: (string | undefined | null)[]): void {
  const title = documentTitle(...parts);
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
