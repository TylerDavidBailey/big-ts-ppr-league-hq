import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon = '🏈', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-hairline px-6 py-14 text-center">
      <span aria-hidden className="text-4xl opacity-70">
        {icon}
      </span>
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-ink">{title}</p>
      {description ? <p className="max-w-md text-sm text-ink-dim">{description}</p> : null}
      {action}
    </div>
  );
}
