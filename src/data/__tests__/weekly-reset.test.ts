import type { VersionConfig } from '@/domain/types';
import { expandOccurrences } from '@/engine';
import { themeIds } from '@/themes';
import { weeklyReset } from '../events/weekly-reset';
import { validateData } from '../validate';
import { WEEKLY_RESET as anniversaryResets } from '../versions/anniversary/weekly-reset';
import { weeklyResetBindings } from '../weekly-reset';

const nov = { start: new Date('2026-11-01T00:00Z'), end: new Date('2026-12-01T00:00Z') };

const version = (events: VersionConfig['events']): VersionConfig => ({
  id: 'test',
  name: 'Test',
  shortName: 'Test',
  status: 'live',
  regions: [
    { id: 'us', label: 'Americas', timeZone: 'America/Los_Angeles' },
    { id: 'eu', label: 'Europe', timeZone: 'Europe/Paris' },
  ],
  defaultRegionId: 'eu',
  baseThemeId: 'base',
  events,
});

describe('weekly reset', () => {
  it('has no event while no region is known', () => {
    expect(weeklyResetBindings({ us: null, eu: null })).toEqual([]);
  });

  it('shows a known region its reset, and never lends it to a region without data', () => {
    const source = 'https://example.com/reset';
    const v = version(weeklyResetBindings({ us: { weekday: 2, time: '08:00', source }, eu: null }));
    expect(validateData({ events: [weeklyReset], versions: [v], themeIds })).toEqual([]);

    const us = expandOccurrences(v, 'us', nov);
    expect(us).toHaveLength(4); // Tuesdays in November 2026
    expect(us[0]?.start.toISOString()).toBe('2026-11-03T16:00:00.000Z'); // 08:00 PST
    const [first] = us;
    expect(first && first.end.getTime() - first.start.getTime()).toBe(60_000);
    expect(expandOccurrences(v, 'eu', nov)).toEqual([]);
  });

  it('flags a region list that names an unknown region', () => {
    const [binding] = weeklyResetBindings({
      us: { weekday: 2, time: '08:00', source: 'https://example.com' },
    });
    const v = version([{ ...binding!, regions: ['us', 'oce'] }]);
    expect(validateData({ events: [weeklyReset], versions: [v], themeIds })).toContain(
      'version "test" event "weekly-reset": regions lists unknown "oce"',
    );
  });

  it('Anniversary reset times are TODO until verified: none are filled in without a source', () => {
    for (const reset of Object.values(anniversaryResets)) {
      if (reset) expect(reset.source).toMatch(/^https:\/\//);
    }
  });
});
