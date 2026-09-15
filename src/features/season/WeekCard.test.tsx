import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { WeekCard } from './WeekCard';
import { computeSeasonAwards } from '@/domain/awards';
import { buildSeason } from '@/domain/buildSeason';
import type { SeasonModel } from '@/domain/types';
import { LEAGUE } from '@/league.config';
import { formatMoney, formatPoints } from '@/lib/format';
import { matchupsThrough, seasonFixture } from '@/test/fixtures';

const fixture = seasonFixture();
const context = { playerName: (id: string) => `Player ${id}` };

const finished = buildSeason(fixture);

/** A Tuesday in week 5: four weeks settled, week 5 has scores but is being played. */
const live = buildSeason({
  ...fixture,
  matchupsByWeek: matchupsThrough(5),
  nflState: { season: fixture.league.season, week: 5 },
});

const renderCard = (season: SeasonModel, mode: 'overview' | 'snapshot') =>
  render(
    <MemoryRouter>
      <WeekCard
        season={season}
        awards={computeSeasonAwards(season, context, LEAGUE.places)}
        mode={mode}
      />
    </MemoryRouter>,
  );

/** The lowest score of a week, and the team that posted it, straight from the model. */
function lowestOf(season: SeasonModel, week: number) {
  const played = season.weeks.find((entry) => entry.week === week);
  if (!played) throw new Error(`no week ${week}`);
  const lowest = [...played.teams].sort((a, b) => a.points - b.points)[0];
  if (!lowest) throw new Error(`no teams in week ${week}`);
  return { points: lowest.points, team: season.teamsByRosterId.get(lowest.rosterId) };
}

describe('WeekCard', () => {
  it('names the last regular-season week of a finished season as final', () => {
    renderCard(finished, 'snapshot');

    const card = screen.getByRole('region', { name: `Week ${finished.regularSeasonEndWeek}` });
    expect(within(card).getByText('Final')).toBeInTheDocument();
    expect(within(card).getByText('Regular season final')).toBeInTheDocument();
  });

  it('puts the week that just finished on beer duty, not the one being played', () => {
    renderCard(live, 'snapshot');

    expect(screen.queryByRole('region', { name: 'Week 5' })).toBeNull();
    const card = screen.getByRole('region', { name: 'Week 4' });
    expect(within(card).getByText('In season')).toBeInTheDocument();
    expect(within(card).getByText('Through week 4')).toBeInTheDocument();

    const { points, team } = lowestOf(live, 4);
    expect(within(card).getByText(`${formatPoints(points)} pts`)).toBeInTheDocument();
    expect(within(card).getByText(team?.name ?? '')).toBeInTheDocument();
    expect(within(card).getByText(LEAGUE.punishment.rule)).toBeInTheDocument();
  });

  it('lists the three paid awards without their money, and nothing else', () => {
    renderCard(finished, 'snapshot');

    const leaders = within(screen.getByRole('list', { name: 'Award leaders' }));
    expect(leaders.getAllByRole('listitem')).toHaveLength(3);
    for (const award of Object.values(LEAGUE.awards)) {
      expect(leaders.getByText(award.name)).toBeInTheDocument();
    }
    // A leader has won nothing yet, so no dollar figure sits next to a name.
    expect(screen.queryByText(formatMoney(LEAGUE.awards.regularSeasonChamp.payout))).toBeNull();
    // The season tally lives on the beer duty page; the card is about this week only.
    expect(screen.queryByText(/Most beer duty/i)).toBeNull();
    expect(screen.queryByText(/\d×/)).toBeNull();
  });

  it('carries no links in snapshot mode, so a screenshot has nothing to tap', () => {
    renderCard(finished, 'snapshot');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText(`${LEAGUE.name} · ${finished.season}`)).toBeInTheDocument();
  });

  it('links to the sections and the snapshot from the overview', () => {
    renderCard(finished, 'overview');

    expect(screen.getByRole('link', { name: /All places/ })).toHaveAttribute(
      'href',
      `/${finished.season}/awards`,
    );
    expect(screen.getByRole('link', { name: /Every week/ })).toHaveAttribute(
      'href',
      `/${finished.season}/beer-duty`,
    );
    expect(screen.getByRole('link', { name: /Snapshot/ })).toHaveAttribute(
      'href',
      `/${finished.season}/snapshot`,
    );
  });
});
