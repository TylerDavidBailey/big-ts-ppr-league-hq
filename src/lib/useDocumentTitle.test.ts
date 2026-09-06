import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { documentTitle, useDocumentTitle } from './useDocumentTitle';
import { LEAGUE } from '@/league.config';

describe('documentTitle', () => {
  it('ends with the league name and skips empty parts', () => {
    expect(documentTitle('Awards', '2025')).toBe(`Awards · 2025 · ${LEAGUE.name}`);
    expect(documentTitle(undefined, 'All-time')).toBe(`All-time · ${LEAGUE.name}`);
    expect(documentTitle()).toBe(LEAGUE.name);
  });
});

describe('useDocumentTitle', () => {
  it('sets the title while mounted and restores it after', () => {
    document.title = 'Before';
    const { unmount, rerender } = renderHook(
      (parts: string[]) => {
        useDocumentTitle(...parts);
      },
      {
        initialProps: ['Standings', '2025'],
      },
    );
    expect(document.title).toBe(`Standings · 2025 · ${LEAGUE.name}`);

    rerender(['Stats', '2025']);
    expect(document.title).toBe(`Stats · 2025 · ${LEAGUE.name}`);

    unmount();
    expect(document.title).toBe('Before');
  });
});
