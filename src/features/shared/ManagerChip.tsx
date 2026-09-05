import { Avatar } from './Avatar';
import type { Manager } from '@/domain/history';
import { cn } from '@/lib/cn';

interface ManagerChipProps {
  manager: Manager;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** A manager across seasons: handle first, since team names change yearly. */
export function ManagerChip({ manager, size = 'md', className }: ManagerChipProps) {
  const subtitle = manager.teamName !== manager.name ? manager.teamName : null;

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Avatar avatarId={manager.avatarId} name={manager.name} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{manager.name}</span>
        {subtitle ? <span className="block truncate text-xs text-ink-dim">{subtitle}</span> : null}
      </span>
    </span>
  );
}
