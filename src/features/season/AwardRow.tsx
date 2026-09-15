import { TeamChip } from '../shared/TeamChip';
import { Badge } from '@/components/ui/Badge';
import type { RankedEntry } from '@/domain/awards';
import type { SeasonModel } from '@/domain/types';
import { formatMoney } from '@/lib/format';

interface AwardRowProps {
  icon: string;
  name: string;
  payout?: number;
  /** Everyone in first place. */
  leaders: RankedEntry[];
  season: SeasonModel;
  value: (entry: RankedEntry) => string;
  detail: (entry: RankedEntry) => string;
  tone?: 'brand' | 'loss';
  emptyText: string;
}

/** One award as a row: what it is, who leads, and by how much. */
export function AwardRow({
  icon,
  name,
  payout,
  leaders,
  season,
  value,
  detail,
  tone = 'brand',
  emptyText,
}: AwardRowProps) {
  const first = leaders[0];

  return (
    <li className="flex items-start gap-3 py-2.5">
      <span aria-hidden className="mt-0.5 w-6 shrink-0 text-center text-lg leading-none">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            {name}
          </span>
          {leaders.length > 1 ? <Badge tone="purple">Tied</Badge> : null}
        </div>
        {first ? (
          <div className="mt-1.5 space-y-1.5">
            {leaders.map((leader) => (
              <div
                key={`${leader.rosterId}-${leader.week ?? 0}-${leader.playerId ?? ''}`}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <TeamChip team={season.teamsByRosterId.get(leader.rosterId)} size="sm" />
                  <span className="block truncate pl-8 text-xs text-ink-dim">{detail(leader)}</span>
                </span>
                <span
                  className={`shrink-0 font-display text-lg font-bold tabular ${tone === 'loss' ? 'text-loss' : 'text-brand'}`}
                >
                  {value(leader)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-ink-dim">{emptyText}</p>
        )}
      </div>
      {payout !== undefined ? (
        <span className="shrink-0 font-display text-sm font-bold tabular text-gold">
          {formatMoney(payout)}
        </span>
      ) : null}
    </li>
  );
}
