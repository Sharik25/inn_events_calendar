import type { VersionConfig } from '@/domain/types';
import {
  calendarExportOf,
  DEFAULT_CALENDAR_EXPORT,
  launchInstant,
  pendingLaunches,
  switchVersionPath,
  versionStatus,
} from '../version';

const forever: VersionConfig = {
  id: 'forever',
  name: 'WoW: Forever',
  shortName: 'Forever',
  status: 'upcoming',
  launches: [
    {
      id: 'eu',
      label: 'Europe',
      at: '2026-11-05T00:00:00+01:00',
      timeZone: 'Europe/Paris',
      verified: true,
    },
    {
      id: 'na',
      label: 'America',
      at: '2026-11-04T15:00:00-08:00',
      timeZone: 'America/Los_Angeles',
      verified: true,
    },
  ],
  regions: [{ id: 'global', label: 'All realms', timeZone: 'America/Los_Angeles' }],
  defaultRegionId: 'global',
  baseThemeId: 'forever',
  events: [],
};

describe('version status', () => {
  it('takes the earliest launch as the launch instant', () => {
    expect(launchInstant(forever)?.toISOString()).toBe('2026-11-04T23:00:00.000Z');
    const staggered = {
      launches: [
        { ...forever.launches![0]!, at: '2026-11-05T15:00:00+01:00' },
        forever.launches![1]!,
      ],
    };
    expect(launchInstant(staggered)?.toISOString()).toBe('2026-11-04T23:00:00.000Z');
    expect(launchInstant({})).toBeNull();
    expect(launchInstant({ launches: [{ ...forever.launches![0]!, at: 'soon' }] })).toBeNull();
  });

  it('drops each launch from the pending list at its own moment', () => {
    const staggered = {
      launches: [
        { ...forever.launches![0]!, at: '2026-11-05T15:00:00+01:00' }, // 14:00Z
        forever.launches![1]!, // Nov 4, 23:00Z
      ],
    };
    const ids = (now: string) => pendingLaunches(staggered, new Date(now)).map((l) => l.launch.id);
    expect(ids('2026-11-04T22:59:59Z')).toEqual(['na', 'eu']);
    expect(ids('2026-11-04T23:00:00Z')).toEqual(['eu']);
    expect(ids('2026-11-05T14:00:00Z')).toEqual([]);
    // The worldwide launch: both regions at the same moment.
    expect(pendingLaunches(forever, new Date('2026-11-04T22:59:59Z'))).toHaveLength(2);
    expect(pendingLaunches(forever, new Date('2026-11-04T23:00:00Z'))).toEqual([]);
  });

  it('turns an upcoming version live at launch time', () => {
    expect(versionStatus(forever, new Date('2026-11-04T22:59:59Z'))).toBe('upcoming');
    expect(versionStatus(forever, new Date('2026-11-04T23:00:00Z'))).toBe('live');
    expect(versionStatus({ ...forever, launches: undefined }, new Date('2030-01-01'))).toBe(
      'upcoming',
    );
    expect(versionStatus({ ...forever, status: 'live' }, new Date('2000-01-01'))).toBe('live');
    expect(versionStatus({ ...forever, status: 'retired' }, new Date('2030-01-01'))).toBe(
      'retired',
    );
  });
});

describe('calendar export options', () => {
  it("are the version's own, else whole events from the Day view", () => {
    expect(calendarExportOf(forever)).toBe(DEFAULT_CALENDAR_EXPORT);
    expect(DEFAULT_CALENDAR_EXPORT).toEqual({ scopes: ['event'], onEveryEvent: false });
    const own = { scopes: ['event', 'day'] as const, onEveryEvent: true };
    expect(calendarExportOf({ calendarExport: { ...own, scopes: [...own.scopes] } })).toEqual({
      scopes: ['event', 'day'],
      onEveryEvent: true,
    });
  });
});

describe('switchVersionPath', () => {
  it('keeps the view and date', () => {
    expect(switchVersionPath('/anniversary/week/2026-10-25', 'anniversary', 'forever')).toBe(
      '/forever/week/2026-10-25',
    );
    expect(switchVersionPath('/anniversary/today', 'anniversary', 'forever')).toBe(
      '/forever/today',
    );
    expect(switchVersionPath('/anniversary', 'anniversary', 'forever')).toBe('/forever');
  });

  it('falls back to Today for unrelated paths', () => {
    expect(switchVersionPath('/anniversaryx/today', 'anniversary', 'forever')).toBe(
      '/forever/today',
    );
  });
});
