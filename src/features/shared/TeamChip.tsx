import { Avatar } from './Avatar';
import type { Team } from '@/domain/types';
import { cn } from '@/lib/cn';

interface TeamChipProps {
  team: Team | undefined;
  /** Show the manager's handle under the team name when they differ. */
  showManager?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TeamChip({ team, showManager = false, size = 'md', className }: TeamChipProps) {
  if (!team) {
    return <span className="text-sm text-ink-dim">Unknown team</span>;
  }

  const subtitle = showManager && team.name !== team.managerName ? team.managerName : null;

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Avatar avatarId={team.avatarId} name={team.name} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{team.name}</span>
        {subtitle ? <span className="block truncate text-xs text-ink-dim">{subtitle}</span> : null}
      </span>
    </span>
  );
}
