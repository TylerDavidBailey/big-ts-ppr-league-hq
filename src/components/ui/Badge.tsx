import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'win' | 'loss' | 'gold' | 'purple';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-white/5 text-ink-muted border-hairline',
  brand: 'bg-brand/10 text-brand border-brand/30',
  win: 'bg-win/10 text-win border-win/30',
  loss: 'bg-loss/10 text-loss border-loss/40',
  gold: 'bg-gold/10 text-gold border-gold/30',
  purple: 'bg-palette-purple/15 text-palette-lavender border-palette-purple/40',
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
