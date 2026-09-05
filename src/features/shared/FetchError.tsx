import { EmptyState } from '@/components/ui/EmptyState';
import { LEAGUE } from '@/league.config';
import { NotFoundError } from '@/lib/sleeper/client';

/**
 * A failed Sleeper request, explained.
 *
 * A 404 can only mean the id in the config is wrong, since no id ever comes
 * from the visitor.
 */
export function FetchError({ error }: { error: Error }) {
  if (error instanceof NotFoundError) {
    return (
      <EmptyState
        icon="🔍"
        title="League not found"
        description={`Sleeper has no league with the id ${LEAGUE.leagueId}. Check leagueId in src/league.config.ts.`}
      />
    );
  }

  return <EmptyState icon="📡" title="Could not reach Sleeper" description={error.message} />;
}
