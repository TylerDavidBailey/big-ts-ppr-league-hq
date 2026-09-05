import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatPercent,
  formatPoints,
  formatRecord,
  formatSigned,
  ordinal,
  placementLabel,
  statusLabel,
} from './format';

describe('formatPoints', () => {
  it('always shows two decimals', () => {
    expect(formatPoints(98.6)).toBe('98.60');
    expect(formatPoints(100)).toBe('100.00');
    expect(formatPoints(1805.78)).toBe('1,805.78');
  });
});

describe('formatRecord', () => {
  it('omits ties when there are none', () => {
    expect(formatRecord(6, 8, 0)).toBe('6-8');
    expect(formatRecord(6, 7, 1)).toBe('6-7-1');
  });
});

describe('ordinal', () => {
  it('picks the right English suffix', () => {
    expect(['1st', '2nd', '3rd', '4th', '11th', '21st', '22nd', '23rd']).toEqual([
      ordinal(1),
      ordinal(2),
      ordinal(3),
      ordinal(4),
      ordinal(11),
      ordinal(21),
      ordinal(22),
      ordinal(23),
    ]);
  });
});

describe('placementLabel', () => {
  it('names the podium and falls back to an ordinal', () => {
    expect(placementLabel(1)).toBe('Champion');
    expect(placementLabel(2)).toBe('Runner-up');
    expect(placementLabel(3)).toBe('Third place');
    expect(placementLabel(7)).toBe('7th place');
  });
});

describe('statusLabel', () => {
  it('humanises known Sleeper statuses and passes through the rest', () => {
    expect(statusLabel('pre_draft')).toBe('Pre-draft');
    expect(statusLabel('complete')).toBe('Complete');
    expect(statusLabel('some_new_status')).toBe('some new status');
  });
});

describe('formatMoney', () => {
  it('shows whole dollars with a thousands separator', () => {
    expect(formatMoney(125)).toBe('$125');
    expect(formatMoney(1500)).toBe('$1,500');
  });
});

describe('formatPercent', () => {
  it('turns a ratio into a percentage', () => {
    expect(formatPercent(0.6429)).toBe('64.3%');
    expect(formatPercent(1, 0)).toBe('100%');
  });
});

describe('formatSigned', () => {
  it('keeps the sign on both sides of zero', () => {
    expect(formatSigned(1.5)).toBe('+1.50');
    expect(formatSigned(-0.25)).toBe('-0.25');
    expect(formatSigned(0)).toBe('0.00');
  });
});
