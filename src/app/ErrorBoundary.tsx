import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence. A render crash should show something recoverable rather
 * than a blank page, since the app has no server-side error reporting.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md space-y-4 text-center">
          <p aria-hidden className="text-5xl">
            🧯
          </p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            Something broke
          </h1>
          <p className="text-sm text-ink-dim">{error.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              globalThis.location.reload();
            }}
            className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-canvas transition hover:brightness-110"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
