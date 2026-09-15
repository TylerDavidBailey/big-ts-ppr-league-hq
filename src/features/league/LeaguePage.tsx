import { Outlet } from 'react-router-dom';

import { SeasonNav } from './SeasonNav';
import type { LeagueContext } from './useRouteLeague';
import { Avatar } from '../shared/Avatar';
import { FetchError } from '../shared/FetchError';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { LEAGUE } from '@/league.config';
import { useCurrentLeague, useLeagueChain } from '@/lib/sleeper/queries';

interface LeaguePageProps {
  /**
   * No header, no footer, a phone-width column. For the snapshot route, which
   * exists to be screenshotted, so nothing but the route's own card may show.
   */
  bare?: boolean;
}

/**
 * The shell every route renders inside: the top bar with the season switcher,
 * then the route's own page, then the footer.
 *
 * The newest season resolves first so the landing page never waits on the
 * chain; older seasons fill into the switcher as the walk completes.
 */
export function LeaguePage({ bare = false }: LeaguePageProps) {
  const headQuery = useCurrentLeague();
  const head = headQuery.data;
  const chainQuery = useLeagueChain(head);

  const chain = chainQuery.data ?? (head ? [head] : []);
  const context: LeagueContext = { head, chain, chainLoading: !chainQuery.data };

  const body = headQuery.error ? (
    <FetchError
      error={headQuery.error}
      onRetry={() => {
        void headQuery.refetch();
      }}
    />
  ) : (
    <Outlet context={context} />
  );

  if (bare) {
    return <main className="mx-auto w-full max-w-md px-4 py-4">{body}</main>;
  }

  return (
    <>
      <SiteHeader
        avatar={<Avatar avatarId={head?.avatar} name={LEAGUE.name} size="md" />}
        nav={
          <SeasonNav
            chain={chain}
            loading={Boolean(head) && !chainQuery.data && !chainQuery.error}
          />
        }
      />
      <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:py-8">{body}</main>
      <SiteFooter />
    </>
  );
}
