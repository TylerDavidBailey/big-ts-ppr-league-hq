import { EmptyState } from '@/components/ui/EmptyState';
import { NotFoundError } from '@/lib/sleeper/client';

interface FetchErrorProps {
  error: Error;
  /** Runs the failed request again. Omit when nothing can be retried. */
  onRetry?: () => void;
}

const RetryButton = ({ onRetry }: { onRetry: () => void }) => (
  <button
    type="button"
    onClick={onRetry}
    className="mt-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-canvas transition hover:brightness-110"
  >
    Try again
  </button>
);

/**
 * A failed Sleeper request, explained.
 *
 * A 404 can only mean the configured league id is wrong, since no id ever
 * comes from the visitor. That is the commissioner's to fix, so the page says
 * what happened without pointing a league member at the source.
 */
export function FetchError({ error, onRetry }: FetchErrorProps) {
  if (error instanceof NotFoundError) {
    return (
      <EmptyState
        icon="🔍"
        title="League not found"
        description="Sleeper has no league with the configured id. The commissioner can fix this in the site's settings."
      />
    );
  }

  return (
    <EmptyState
      icon="📡"
      title="Could not reach Sleeper"
      description={error.message}
      action={onRetry ? <RetryButton onRetry={onRetry} /> : null}
    />
  );
}
