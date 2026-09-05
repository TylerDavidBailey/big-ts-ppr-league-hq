import { describe, expect, it } from 'vitest';

import { AWARDS } from './registry';

/**
 * `formatValue` produces the string on every award card, so a broken one is
 * visible to every visitor. Each award is checked against its own units.
 */
describe('formatValue', () => {
  const format = (id: string, value: number) => {
    const award = AWARDS.find((candidate) => candidate.id === id);
    if (!award) throw new Error(`No award registered with id "${id}"`);
    return award.formatValue(value);
  };

  it('shows the 1 seed total as points for', () => {
    expect(format('regular-season-champ', 1805.78)).toBe('1805.78 PF');
  });

  it('shows week scores to two decimals', () => {
    expect(format('highest-team-week', 178.4)).toBe('178.40 pts');
    expect(format('highest-player-week', 45)).toBe('45.00 pts');
    expect(format('weekly-punishment', 62.06)).toBe('62.06 pts');
  });

  it('gives every registered award a non-empty label', () => {
    for (const award of AWARDS) {
      expect(award.formatValue(0)).not.toBe('');
      expect(award.formatValue(123.456)).toContain('123.46');
    }
  });
});
