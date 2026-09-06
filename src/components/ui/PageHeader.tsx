import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Small label above the title: the season, or the scope. */
  eyebrow?: ReactNode;
  title: string;
  /** Status badges, shown inline after the title. */
  badges?: ReactNode;
  /** Chips or a short line under the title: team count, freshness. */
  meta?: ReactNode;
  /** Right-hand slot, such as the pot. */
  aside?: ReactNode;
}

/**
 * The heading block at the top of every route.
 *
 * The title is an `h2`: the `h1` is the site name in the top bar, so the
 * league name appears in exactly one heading. The eyebrow carries the season
 * so the title can name the section, which is what changes between tabs.
 */
export function PageHeader({ eyebrow, title, badges, meta, aside }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
            {title}
          </h2>
          {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
        </div>
        {meta ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-ink-dim">
            {meta}
          </div>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}
