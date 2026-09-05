import { describe, expect, it } from 'vitest';

import { SEASON_SECTIONS, seasonSectionSuffix } from './sections';

describe('seasonSectionSuffix', () => {
  it('keeps the section of a season route', () => {
    expect(seasonSectionSuffix('/2025/standings')).toBe('/standings');
    expect(seasonSectionSuffix('/2025/beer-duty')).toBe('/beer-duty');
  });

  it('has no section on a season overview', () => {
    expect(seasonSectionSuffix('/')).toBe('');
    expect(seasonSectionSuffix('/2025')).toBe('');
  });

  it('sends an all-time route to the season overview', () => {
    expect(seasonSectionSuffix('/all-time')).toBe('');
    expect(seasonSectionSuffix('/all-time/records')).toBe('');
  });

  it('ignores a segment that is not a season section', () => {
    expect(seasonSectionSuffix('/2025/bogus')).toBe('');
    expect(seasonSectionSuffix('/nonsense/path')).toBe('');
  });

  it('round-trips every section but the overview', () => {
    for (const section of SEASON_SECTIONS) {
      expect(seasonSectionSuffix(`/2025${section.path}`)).toBe(section.path);
    }
  });
});
