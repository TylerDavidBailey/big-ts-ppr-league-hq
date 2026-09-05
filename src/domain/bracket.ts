/**
 * Turning a Sleeper playoff bracket into a finishing order.
 *
 * Sleeper marks placement games with a `p` field: the winner of `p: 1` finishes
 * 1st and its loser 2nd, the winner of `p: 3` finishes 3rd and its loser 4th,
 * and so on. Ordinary advancement matches carry no `p`.
 */
import type { Bracket, Placement } from './types';
import type { SleeperBracketMatch } from '@/lib/sleeper/types';

export function buildBracket(matches: SleeperBracketMatch[]): Bracket {
  const placements: Placement[] = [];

  for (const match of matches) {
    if (match.p === undefined) continue;
    if (match.w !== null) placements.push({ place: match.p, rosterId: match.w });
    if (match.l !== null) placements.push({ place: match.p + 1, rosterId: match.l });
  }

  placements.sort((a, b) => a.place - b.place);
  return { matches, placements };
}

/** Rounds in display order, each holding its matches sorted by match number. */
export function groupByRound(matches: SleeperBracketMatch[]): SleeperBracketMatch[][] {
  const rounds = new Map<number, SleeperBracketMatch[]>();
  for (const match of matches) {
    const bucket = rounds.get(match.r);
    if (bucket) bucket.push(match);
    else rounds.set(match.r, [match]);
  }

  return [...rounds.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group.sort((a, b) => a.m - b.m));
}

export const placementFor = (bracket: Bracket, rosterId: number): number | null =>
  bracket.placements.find((placement) => placement.rosterId === rosterId)?.place ?? null;
