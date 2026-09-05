/**
 * The season page's tab definitions.
 *
 * Kept out of the component file so Fast Refresh stays effective: a module that
 * exports both components and constants loses its refresh boundary.
 */
export const SEASON_TABS = [
  { slug: 'awards', label: 'Awards' },
  { slug: 'standings', label: 'Standings' },
  { slug: 'scoreboard', label: 'Scoreboard' },
  { slug: 'playoffs', label: 'Playoffs' },
  { slug: 'history', label: 'History' },
] as const;

export type SeasonTabSlug = (typeof SEASON_TABS)[number]['slug'];

export const DEFAULT_TAB: SeasonTabSlug = 'awards';

export const isSeasonTab = (value: string): value is SeasonTabSlug =>
  SEASON_TABS.some((tab) => tab.slug === value);
