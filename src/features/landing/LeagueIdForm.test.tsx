import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { LeagueIdForm } from './LeagueIdForm';

/** Renders the form with a probe route so we can assert where it navigated. */
function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LeagueIdForm />} />
        <Route path="/l/:leagueId" element={<p>league page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const submit = async (value: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/sleeper league id/i), value);
  await user.click(screen.getByRole('button', { name: /load league/i }));
};

describe('LeagueIdForm', () => {
  it('navigates to the league page for a valid id', async () => {
    renderForm();
    await submit('1373305494734651392');

    expect(screen.getByText('league page')).toBeInTheDocument();
  });

  it('accepts a pasted Sleeper league URL', async () => {
    renderForm();
    await submit('https://sleeper.com/leagues/1373305494734651392/team');

    expect(screen.getByText('league page')).toBeInTheDocument();
  });

  it('trims surrounding whitespace', async () => {
    renderForm();
    await submit('  1373305494734651392  ');

    expect(screen.getByText('league page')).toBeInTheDocument();
  });

  it('rejects an obviously wrong id without navigating', async () => {
    renderForm();
    await submit('not-a-league');

    expect(screen.queryByText('league page')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/does not look like a sleeper league id/i);
    expect(screen.getByLabelText(/sleeper league id/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the error once the field is edited again', async () => {
    const user = userEvent.setup();
    renderForm();
    await submit('nope');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/sleeper league id/i), '1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
