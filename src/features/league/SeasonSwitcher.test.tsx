import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { SeasonSwitcher } from './SeasonSwitcher';
import type { SleeperLeague } from '@/lib/sleeper/types';

const league = (season: string, status: SleeperLeague['status']): SleeperLeague =>
  ({ league_id: `league-${season}`, season, status }) as SleeperLeague;

const CHAIN = [league('2026', 'pre_draft'), league('2025', 'complete'), league('2024', 'complete')];

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SeasonSwitcher chain={CHAIN} loading={false} />
    </MemoryRouter>,
  );

/** The route the switcher navigated to. */
function Here() {
  const { pathname } = useLocation();
  return <span data-testid="path">{pathname}</span>;
}

const trigger = () => screen.getByRole('button');
const seasons = () => within(screen.getByRole('list', { name: 'Seasons' })).getAllByRole('link');

describe('SeasonSwitcher', () => {
  it('keeps the seasons behind the button until it is opened', async () => {
    const user = userEvent.setup();
    renderAt('/2025');

    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Seasons' })).toBeNull();

    await user.click(trigger());

    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(seasons().map((link) => link.textContent)).toEqual(['2026Pre-draft', '2025', '2024']);
  });

  it('names the season being read, and marks it in the list', async () => {
    const user = userEvent.setup();
    renderAt('/2025/standings');

    expect(trigger()).toHaveTextContent('2025');

    await user.click(trigger());
    expect(seasons()[1]).toHaveAttribute('aria-current', 'page');
    expect(seasons()[0]).not.toHaveAttribute('aria-current');
  });

  it('keeps the section when switching year', async () => {
    const user = userEvent.setup();
    renderAt('/2025/standings');
    await user.click(trigger());

    expect(seasons().map((link) => link.getAttribute('href'))).toEqual([
      '/2026/standings',
      '/2025/standings',
      '/2024/standings',
    ]);
  });

  it('falls back to the overview from an all-time route', async () => {
    const user = userEvent.setup();
    renderAt('/all-time/records');

    // No season is being read there, so the button offers the list instead.
    expect(trigger()).toHaveTextContent('Seasons');

    await user.click(trigger());
    expect(seasons().map((link) => link.getAttribute('href'))).toEqual(['/2026', '/2025', '/2024']);
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
  });

  it('opens onto the season being read and walks with the arrow keys', async () => {
    const user = userEvent.setup();
    renderAt('/2025');

    await user.click(trigger());
    expect(seasons()[1]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(seasons()[2]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(seasons()[0]).toHaveFocus(); // wraps

    await user.keyboard('{Home}');
    expect(seasons()[0]).toHaveFocus();

    await user.keyboard('{End}');
    expect(seasons()[2]).toHaveFocus();
  });

  it('opens upwards onto the oldest season', async () => {
    const user = userEvent.setup();
    renderAt('/2025');

    await user.tab();
    expect(trigger()).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(seasons().at(-1)).toHaveFocus();
  });

  it('closes on escape and hands focus back to the button', async () => {
    const user = userEvent.setup();
    renderAt('/2025');

    await user.click(trigger());
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('list', { name: 'Seasons' })).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('closes on a press outside it', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/2025']}>
        <SeasonSwitcher chain={CHAIN} loading={false} />
        <button type="button">elsewhere</button>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /2025/ }));
    expect(screen.getByRole('list', { name: 'Seasons' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByRole('list', { name: 'Seasons' })).toBeNull();
  });

  it('follows a row that is pressed without being focused', async () => {
    // Safari does not focus a link it is pressing, so the press blurs the row
    // the panel opened on and hands focus to nothing. Closing on that blur
    // unmounted the row before its click landed, and the season never opened.
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <SeasonSwitcher chain={CHAIN} loading={false} />
        <Routes>
          <Route path="*" element={<Here />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(trigger());
    const row = seasons()[1]!;

    fireEvent.pointerDown(row);
    // The press takes focus off the row and gives it to nothing.
    fireEvent.focusOut(row, { relatedTarget: null });
    expect(screen.getByRole('list', { name: 'Seasons' })).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.getByTestId('path')).toHaveTextContent('/2025');
  });

  it('stands in a skeleton until the chain resolves', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SeasonSwitcher chain={[]} loading />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
