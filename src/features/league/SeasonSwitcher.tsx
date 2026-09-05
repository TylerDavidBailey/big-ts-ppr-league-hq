import { type FocusEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { seasonSectionSuffix } from '../season/sections';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { statusLabel } from '@/lib/format';
import type { SleeperLeague } from '@/lib/sleeper/types';

/**
 * The season a route is about, or `undefined` when no season is.
 *
 * Read from the path rather than the chain, so the button names the right year
 * on the first paint, before the season walk finishes. `/` is the newest
 * season; an all-time route is no season at all.
 */
function activeSeasonOf(pathname: string, head: SleeperLeague | undefined): string | undefined {
  const [, first] = pathname.split('/');
  if (!first) return head?.season;
  return /^\d{4}$/.test(first) ? first : undefined;
}

/**
 * The seasons, behind one button.
 *
 * A league gains a season every year and never loses one, so a pill per season
 * would outgrow the header. The button names the season you are reading and
 * opens the rest.
 *
 * This is the ARIA disclosure navigation pattern rather than a menu: the rows
 * are links to pages, so they keep link semantics. Every keyboard handler sits
 * on the button or a link, never on the wrapper, so nothing static is made
 * interactive.
 */
export function SeasonSwitcher({ chain, loading }: { chain: SleeperLeague[]; loading: boolean }) {
  const { pathname } = useLocation();
  const panelId = useId();
  // The path the panel was opened on, so a route change closes it during the
  // next render rather than in an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (next: boolean) => {
    setOpenAt(next ? pathname : null);
  };
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  // Which row the next open should land on. Set in a handler, read once the
  // panel has committed, so focus never races the render.
  const landing = useRef<'active' | 'last'>('active');

  const head = chain[0];
  const activeSeason = activeSeasonOf(pathname, head);
  const suffix = seasonSectionSuffix(pathname);

  // A pointer press anywhere else dismisses the panel. `pointerdown` rather
  // than `click` so a press that starts outside closes before it lands.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpenAt(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  // Opening lands focus on the season you are already reading, or on the last
  // row when the panel was opened upwards.
  useEffect(() => {
    if (!open) return;
    const rows = [...(panelRef.current?.querySelectorAll('a') ?? [])];
    const active = rows.find((row) => row.getAttribute('aria-current') === 'page');
    const target = landing.current === 'last' ? rows.at(-1) : (active ?? rows[0]);
    landing.current = 'active';
    target?.focus();
  }, [open]);

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const focusLink = (index: number) => {
    const links = panelRef.current?.querySelectorAll('a');
    if (!links?.length) return;
    const wrapped = (index + links.length) % links.length;
    links[wrapped]?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    landing.current = event.key === 'ArrowUp' ? 'last' : 'active';
    setOpen(true);
  };

  const onLinkKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    const links = [...(panelRef.current?.querySelectorAll('a') ?? [])];
    const index = links.indexOf(event.currentTarget);

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeAndFocusTrigger();
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusLink(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusLink(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusLink(0);
        break;
      case 'End':
        event.preventDefault();
        focusLink(links.length - 1);
        break;
      default:
        break;
    }
  };

  // Tabbing past the last row leaves the panel, so it should not stay open.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!wrapperRef.current?.contains(event.relatedTarget)) setOpen(false);
  };

  if (chain.length === 0) return <Skeleton className="h-9 w-24" />;

  return (
    <div ref={wrapperRef} className="relative" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          landing.current = 'active';
          setOpen(!open);
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-sm font-semibold tabular transition',
          activeSeason
            ? 'bg-brand text-canvas'
            : 'border border-hairline text-ink-muted hover:border-brand/40 hover:text-brand',
        )}
      >
        <span className="sr-only">Season </span>
        {activeSeason ?? 'Seasons'}
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={panelRef}
          id={panelId}
          aria-label="Seasons"
          className="absolute right-0 top-full z-30 mt-2 max-h-[60vh] w-44 space-y-0.5 overflow-y-auto rounded-xl border border-hairline bg-surface p-1 shadow-2xl shadow-black/60"
        >
          {chain.map((league) => {
            const active = league.season === activeSeason;
            return (
              <li key={league.league_id}>
                <Link
                  to={`/${league.season}${suffix}`}
                  aria-current={active ? 'page' : undefined}
                  onKeyDown={onLinkKeyDown}
                  // The row unmounts on navigation, so hand focus back rather
                  // than dropping it on the body.
                  onClick={closeAndFocusTrigger}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg px-3 py-2 font-display text-sm font-semibold tabular transition',
                    active
                      ? 'bg-brand/15 text-brand'
                      : 'text-ink-muted hover:bg-white/[0.06] hover:text-ink',
                  )}
                >
                  {league.season}
                  {league.status === 'complete' ? null : (
                    <Badge
                      tone="brand"
                      className="px-2 py-0 text-[10px] normal-case tracking-normal"
                    >
                      {statusLabel(league.status)}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
          {loading ? (
            <li>
              <Skeleton className="h-9 w-full" />
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
