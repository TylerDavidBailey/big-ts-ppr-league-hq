import { useState } from 'react';

import { cn } from '@/lib/cn';
import { playerImageUrl } from '@/lib/sleeper/assets';
import type { PlayerInfo } from '@/lib/players';

const POSITION_TONE: Record<string, string> = {
  QB: 'text-palette-salmon',
  RB: 'text-palette-mint',
  WR: 'text-palette-aqua',
  TE: 'text-palette-orange',
  K: 'text-palette-lavender',
  DEF: 'text-palette-lime',
};

interface PlayerChipProps {
  player: PlayerInfo;
  className?: string;
}

export function PlayerChip({ player, className }: PlayerChipProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {failed ? (
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full border border-hairline bg-raised text-xs font-semibold text-ink-dim"
        >
          {player.name.slice(0, 2).toUpperCase()}
        </span>
      ) : (
        <img
          src={playerImageUrl(player.id, player.position)}
          alt=""
          loading="lazy"
          className="size-9 shrink-0 rounded-full border border-hairline bg-raised object-cover"
          onError={() => {
            setFailed(true);
          }}
        />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{player.name}</span>
        {player.position ? (
          <span className="block truncate text-xs">
            <span className={cn('font-semibold', POSITION_TONE[player.position] ?? 'text-ink-dim')}>
              {player.position}
            </span>
            {player.team ? <span className="text-ink-dim"> · {player.team}</span> : null}
          </span>
        ) : null}
      </span>
    </span>
  );
}
