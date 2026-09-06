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
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = { sm: 'size-7', md: 'size-9' } as const;

export function PlayerChip({ player, size = 'md', className }: PlayerChipProps) {
  const [failed, setFailed] = useState(false);
  const shell = cn('shrink-0 rounded-full border border-hairline bg-raised', SIZES[size]);

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {failed ? (
        <span
          aria-hidden
          className={cn(shell, 'grid place-items-center text-xs font-semibold text-ink-dim')}
        >
          {player.name.slice(0, 2).toUpperCase()}
        </span>
      ) : (
        <img
          src={playerImageUrl(player.id, player.position)}
          alt=""
          loading="lazy"
          className={cn(shell, 'object-cover')}
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
