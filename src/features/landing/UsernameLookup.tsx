import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';

import { Avatar } from '../shared/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { NotFoundError } from '@/lib/sleeper/client';
import { useNflState, useUserByName, useUserLeagues } from '@/lib/sleeper/queries';

/**
 * Escape hatch for anyone who does not know their league ID: look up their
 * Sleeper username and list the leagues they are in this season.
 */
export function UsernameLookup() {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');

  const nflState = useNflState();
  const userQuery = useUserByName(submitted, submitted.length > 0);
  const leaguesQuery = useUserLeagues(userQuery.data?.user_id, nflState.data?.season);

  function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setSubmitted(input.trim());
  }

  const notFound = userQuery.error instanceof NotFoundError;
  const isBusy = submitted.length > 0 && (userQuery.isPending || leaguesQuery.isPending);
  const leagues = leaguesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="username" className="sr-only">
          Sleeper username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          spellCheck={false}
          placeholder="Sleeper username"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          className="min-w-0 flex-1 rounded-xl border border-hairline bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-dim/70 transition focus:border-brand/50 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-hairline bg-raised px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
        >
          Find my leagues
        </button>
      </form>

      {isBusy ? (
        <p className="flex items-center gap-2 text-sm text-ink-dim">
          <Spinner className="size-4" /> Looking up {submitted}…
        </p>
      ) : null}

      {notFound ? (
        <p role="alert" className="text-sm text-loss">
          No Sleeper user named “{submitted}”.
        </p>
      ) : null}

      {!isBusy && userQuery.data && leagues.length === 0 && leaguesQuery.isSuccess ? (
        <p className="text-sm text-ink-dim">
          {userQuery.data.display_name} has no {nflState.data?.season} leagues.
        </p>
      ) : null}

      {leagues.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {leagues.map((league) => (
            <li key={league.league_id}>
              <Link
                to={`/l/${league.league_id}`}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-3.5 py-3 transition hover:border-brand/40 hover:bg-raised"
              >
                <Avatar avatarId={league.avatar} name={league.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {league.name}
                  </span>
                  <span className="block text-xs text-ink-dim">
                    {league.season} · {league.total_rosters} teams
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
