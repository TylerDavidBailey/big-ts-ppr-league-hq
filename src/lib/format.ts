/** Small display helpers shared across the views. */

export const formatPoints = (value: number): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatRecord(wins: number, losses: number, ties: number): string {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

const ORDINAL_RULES = new Intl.PluralRules('en-US', { type: 'ordinal' });
const ORDINAL_SUFFIX: Record<Intl.LDMLPluralRule, string> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
  zero: 'th',
  many: 'th',
};

export const ordinal = (value: number): string =>
  `${value}${ORDINAL_SUFFIX[ORDINAL_RULES.select(value)]}`;

export const PLACEMENT_LABEL: Record<number, string> = {
  1: 'Champion',
  2: 'Runner-up',
  3: 'Third place',
};

export const placementLabel = (place: number): string =>
  PLACEMENT_LABEL[place] ?? `${ordinal(place)} place`;

const LEAGUE_STATUS_LABEL: Record<string, string> = {
  pre_draft: 'Pre-draft',
  drafting: 'Drafting',
  in_season: 'In season',
  complete: 'Complete',
};

export const statusLabel = (status: string): string =>
  LEAGUE_STATUS_LABEL[status] ?? status.replace(/_/g, ' ');

/** Sleeper league ids are large numeric strings. */
export const isValidLeagueId = (value: string): boolean => /^\d{6,25}$/.test(value.trim());

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.round((timestamp - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
  ];

  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return formatter.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return 'just now';
}
