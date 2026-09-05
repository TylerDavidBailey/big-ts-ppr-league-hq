import { Link } from 'react-router-dom';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span aria-hidden className="text-lg">
            🏈
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-ink">
            Sleeper League <span className="text-brand">HQ</span>
          </span>
        </Link>

        <a
          href="https://github.com/TylerDavidBailey/sleeper-league-hq"
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs font-semibold text-ink-dim transition hover:text-brand"
        >
          Source
        </a>
      </div>
    </header>
  );
}
