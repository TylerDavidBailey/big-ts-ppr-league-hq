/**
 * The sections a season is split into, in the order they appear in the tabs.
 *
 * This lives apart from `SeasonRoute` because the header's season switcher
 * needs it too, and importing it from `SeasonRoute` would close a cycle:
 * `SeasonRoute` already imports `useRouteLeague` from `features/league`.
 */
export type SeasonView = 'overview' | 'awards' | 'beer-duty' | 'standings' | 'stats' | 'rules';

export interface SeasonSection {
  view: SeasonView;
  label: string;
  /** Appended to `/{season}`. Empty for the overview, which is the season root. */
  path: string;
}

export const SEASON_SECTIONS: SeasonSection[] = [
  { view: 'overview', label: 'Overview', path: '' },
  { view: 'awards', label: 'Awards', path: '/awards' },
  { view: 'beer-duty', label: 'Beer duty', path: '/beer-duty' },
  { view: 'standings', label: 'Standings', path: '/standings' },
  { view: 'stats', label: 'Stats', path: '/stats' },
  { view: 'rules', label: 'Rules', path: '/rules' },
];

/**
 * The section of a season route, as a path suffix, or `''` for anything else.
 *
 * Switching year keeps you on the page you were reading, so `/2025/standings`
 * offers `/2024/standings`. An all-time route or an unknown segment falls back
 * to the season overview rather than building a route that would redirect.
 */
export function seasonSectionSuffix(pathname: string): string {
  const [, first, second] = pathname.split('/');
  if (!first || first === 'all-time' || !second) return '';
  return SEASON_SECTIONS.some((section) => section.path === `/${second}`) ? `/${second}` : '';
}
