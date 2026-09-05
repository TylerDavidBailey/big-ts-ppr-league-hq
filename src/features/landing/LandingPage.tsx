import { Link } from 'react-router-dom';

import { EXAMPLE_LEAGUE_ID, LeagueIdForm } from './LeagueIdForm';
import { RecentLeagues } from './RecentLeagues';
import { UsernameLookup } from './UsernameLookup';

const FEATURES = [
  {
    icon: '🏆',
    title: 'Awards',
    body: 'Season awards and the weekly punishment, resolved automatically.',
  },
  { icon: '📊', title: 'Standings', body: 'Records, points for and against, and current form.' },
  { icon: '🗓️', title: 'Scoreboard', body: 'Every matchup, week by week, with the top starter.' },
  { icon: '🕰️', title: 'History', body: 'Every past season of the league, all the way back.' },
];

export function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:py-20">
      <header className="space-y-4 text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          Sleeper League HQ
        </p>
        <h1 className="font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
          Your league,
          <br />
          <span className="text-brand">settled.</span>
        </h1>
        <p className="mx-auto max-w-xl text-base text-ink-muted">
          Paste a Sleeper league ID to see standings, weekly scoreboards, the playoff bracket and
          every season award. Works for any league, any season, no login.
        </p>
      </header>

      <div className="mt-10">
        <LeagueIdForm />
      </div>

      <p className="mt-4 text-center text-sm text-ink-dim">
        Haven&apos;t got an ID handy?{' '}
        <Link
          to={`/l/${EXAMPLE_LEAGUE_ID}/awards`}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Look at an example league
        </Link>
        .
      </p>

      <div className="mt-10 space-y-8">
        <RecentLeagues />

        <section aria-labelledby="lookup-heading" className="space-y-3">
          <h2
            id="lookup-heading"
            className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim"
          >
            Don&apos;t know your league ID?
          </h2>
          <UsernameLookup />
        </section>
      </div>

      <ul className="mt-14 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="rounded-xl border border-hairline bg-surface/60 p-4">
            <p aria-hidden className="text-xl">
              {feature.icon}
            </p>
            <p className="mt-1.5 font-display text-sm font-semibold uppercase tracking-wide text-ink">
              {feature.title}
            </p>
            <p className="mt-1 text-sm text-ink-dim">{feature.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
