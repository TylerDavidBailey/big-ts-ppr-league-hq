import { Outlet } from 'react-router-dom';

import type { LeagueContext } from './useRouteLeague';
import { YearNav } from './YearNav';
import { Avatar } from '../shared/Avatar';
import { FetchError } from '../shared/FetchError';
import { SiteHeader } from '@/components/SiteHeader';
import { LEAGUE } from '@/league.config';
import { useCurrentLeague, useLeagueChain } from '@/lib/sleeper/queries';

/**
 * The shell every route renders inside: the top bar with the season pills,
 * then the route's own page.
 *
 * The newest season resolves first so the landing page never waits on the
 * chain; older seasons fill into the nav as the walk completes.
 */
export function LeaguePage() {
  const headQuery = useCurrentLeague();
  const head = headQuery.data;
  const chainQuery = useLeagueChain(head);

  const chain = chainQuery.data ?? (head ? [head] : []);
  const context: LeagueContext = { head, chain, chainLoading: !chainQuery.data };

  return (
    <>
      <SiteHeader
        avatar={<Avatar avatarId={head?.avatar} name={LEAGUE.name} size="md" />}
        nav={
          <YearNav chain={chain} loading={Boolean(head) && !chainQuery.data && !chainQuery.error} />
        }
      />
      <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:py-8">
        {headQuery.error ? <FetchError error={headQuery.error} /> : <Outlet context={context} />}
      </main>
    </>
  );
}
