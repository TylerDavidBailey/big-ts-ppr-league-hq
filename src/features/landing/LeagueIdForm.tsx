import { useState, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { isValidLeagueId } from '@/lib/format';

/**
 * A public league to show someone who arrived without an ID of their own.
 *
 * Without a way in, a visitor with no ID handy has nothing to look at and
 * leaves. League data is public, so linking one costs nothing.
 */
export const EXAMPLE_LEAGUE_ID = '1252998165817208832';

/** Sleeper league URLs look like https://sleeper.com/leagues/1234567890/team */
function extractLeagueId(input: string): string {
  const trimmed = input.trim();
  const fromUrl = /leagues?\/(\d{6,25})/.exec(trimmed);
  return fromUrl?.[1] ?? trimmed;
}

export function LeagueIdForm() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    const leagueId = extractLeagueId(value);

    if (!isValidLeagueId(leagueId)) {
      setError('That does not look like a Sleeper league ID. Paste the ID or the league URL.');
      return;
    }

    setError(null);
    void navigate(`/l/${leagueId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="league-id" className="sr-only">
        Sleeper league ID
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="league-id"
          name="leagueId"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste your league ID or Sleeper league URL"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? 'league-id-error' : 'league-id-hint'}
          className="min-w-0 flex-1 rounded-xl border border-hairline bg-surface px-4 py-3.5 text-base text-ink placeholder:text-ink-dim/70 transition focus:border-brand/50 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-brand px-7 py-3.5 font-display text-base font-bold uppercase tracking-wide text-canvas transition hover:brightness-110 active:scale-[0.98]"
        >
          Load league
        </button>
      </div>

      {error ? (
        <p id="league-id-error" role="alert" className="mt-2.5 text-sm text-loss">
          {error}
        </p>
      ) : (
        <p id="league-id-hint" className="mt-2.5 text-sm text-ink-dim">
          Find it in your Sleeper league URL:{' '}
          <span className="font-mono text-ink-muted">sleeper.com/leagues/</span>
          <span className="font-mono text-brand">{EXAMPLE_LEAGUE_ID}</span>
        </p>
      )}
    </form>
  );
}
