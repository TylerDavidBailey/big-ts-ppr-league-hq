import { useState } from 'react';

import { cn } from '@/lib/cn';
import { avatarUrl } from '@/lib/sleeper/assets';

interface AvatarProps {
  avatarId: string | null | undefined;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'size-6 text-[10px]', md: 'size-9 text-xs', lg: 'size-14 text-base' } as const;

/** Sleeper avatar with an initials fallback for missing or broken images. */
export function Avatar({ avatarId, name, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = avatarUrl(avatarId);
  const initials = name.slice(0, 2).toUpperCase();

  const shell = cn(
    'shrink-0 overflow-hidden rounded-full border border-hairline bg-raised',
    SIZES[size],
    className,
  );

  if (!url || failed) {
    return (
      <span
        aria-hidden
        className={cn(shell, 'grid place-items-center font-display font-semibold text-ink-dim')}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn(shell, 'object-cover')}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
