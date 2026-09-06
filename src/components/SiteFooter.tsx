import { LEAGUE } from '@/league.config';

/** The disclaimer, and the two outbound links so a phone has them too. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-x-8 gap-y-3 px-5 py-6 text-xs leading-relaxed text-ink-dim">
        <p className="max-w-2xl">
          Built on Sleeper&apos;s public read-only API. Not affiliated with or endorsed by Sleeper.
          Scores are read straight from Sleeper in your browser; nothing is stored anywhere.
        </p>
        <nav aria-label="Links" className="flex gap-4 font-semibold">
          <a
            href={LEAGUE.sleeperUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="transition hover:text-brand"
          >
            League on Sleeper
          </a>
          <a
            href={LEAGUE.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="transition hover:text-brand"
          >
            Source
          </a>
        </nav>
      </div>
    </footer>
  );
}
