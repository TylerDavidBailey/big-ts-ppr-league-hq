import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { LEAGUE } from '@/league.config';

interface SiteHeaderProps {
  /** The league avatar, rendered by the shell once it knows the league. */
  avatar: ReactNode;
  /** The season switcher and all-time link. Its own landmark, so it sits outside the brand link. */
  nav: ReactNode;
}

/**
 * The sticky top bar: brand on the left, seasons on the right.
 *
 * The site name is the page's only `h1`, so every route shares one. The nav
 * stays two buttons wide at every width, so it never needs a row of its own.
 */
export function SiteHeader({ avatar, nav }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          {avatar}
          <h1 className="truncate font-display text-base font-bold uppercase tracking-[0.12em] text-ink sm:text-lg">
            {LEAGUE.name} <span className="text-brand">HQ</span>
          </h1>
        </Link>

        <div className="ml-auto hidden items-center gap-4 text-xs font-semibold text-ink-dim sm:flex">
          <a
            href={LEAGUE.sleeperUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="transition hover:text-brand"
          >
            Sleeper
          </a>
          <a
            href={LEAGUE.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="transition hover:text-brand"
          >
            Source
          </a>
        </div>

        <div className="ml-auto sm:ml-0">{nav}</div>
      </div>
    </header>
  );
}
