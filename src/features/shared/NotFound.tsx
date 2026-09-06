import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

/** An address the site has no page for. Says so, rather than silently landing home. */
export function NotFound() {
  useDocumentTitle('Page not found');

  return (
    <EmptyState
      icon="🧭"
      title="No such page"
      description="That link does not go anywhere here. It may be from an older version of the site."
      action={
        <Link
          to="/"
          className="mt-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-canvas transition hover:brightness-110"
        >
          Current season
        </Link>
      }
    />
  );
}
