import { act } from '@testing-library/react';
import type { VersionConfig } from '@/domain/types';
import {
  defaultSettings,
  localeWeekStart,
  migrateSettings,
  resolveRegionId,
  SETTINGS_STORAGE_KEY,
  useSettings,
} from './settings';

const version: VersionConfig = {
  id: 'anniversary',
  name: 'Anniversary',
  shortName: 'Anniversary',
  status: 'live',
  regions: [
    { id: 'us', label: 'Americas', timeZone: 'America/Los_Angeles' },
    { id: 'eu', label: 'Europe', timeZone: 'Europe/Paris' },
  ],
  defaultRegionId: 'eu',
  baseThemeId: 'base',
  events: [],
};

beforeEach(() => {
  localStorage.clear();
  useSettings.setState(defaultSettings());
});

describe('resolveRegionId', () => {
  it('guesses from the user time zone when nothing was chosen', () => {
    expect(resolveRegionId(version, {}, 'America/Chicago')).toBe('us');
    expect(resolveRegionId(version, {}, 'Asia/Jerusalem')).toBe('eu');
  });

  it("prefers the user's choice for that version", () => {
    expect(resolveRegionId(version, { anniversary: 'us' }, 'Europe/Paris')).toBe('us');
    expect(resolveRegionId(version, { forever: 'us' }, 'Europe/Paris')).toBe('eu');
  });

  it('ignores a stored choice that the version no longer offers', () => {
    expect(resolveRegionId(version, { anniversary: 'oce' }, 'Europe/Paris')).toBe('eu');
  });
});

describe('settings store', () => {
  it('stores the region per version and persists it under the versioned key', () => {
    act(() => useSettings.getState().setRegion('anniversary', 'us'));
    expect(useSettings.getState().regionByVersion).toEqual({ anniversary: 'us' });

    const persisted = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
    expect(persisted.version).toBe(2);
    expect(persisted.state.regionByVersion).toEqual({ anniversary: 'us' });
    expect(persisted.state).not.toHaveProperty('setRegion');
  });

  it('updates the other settings', () => {
    const s = useSettings.getState();
    act(() => {
      s.chooseVersion('forever');
      s.setTimeDisplay('server');
      s.setWeekStartsOn(0);
      s.setHiddenCategories([]);
      s.setReducedMotion('on');
    });
    expect(useSettings.getState()).toMatchObject({
      chosenVersionId: 'forever',
      timeDisplay: 'server',
      weekStartsOn: 0,
      hiddenCategories: [],
      reducedMotion: 'on',
    });
  });
});

describe('migrateSettings', () => {
  it('fills missing fields with defaults and keeps known ones', () => {
    expect(migrateSettings({ regionByVersion: { anniversary: 'us' } }, 0)).toEqual({
      ...defaultSettings(),
      regionByVersion: { anniversary: 'us' },
    });
    expect(migrateSettings(null, 0)).toEqual(defaultSettings());
  });

  it('v1 → v2: drops the visit-tracked versionId, so the default version applies', () => {
    const v1 = { versionId: 'anniversary', timeDisplay: 'server' };
    expect(migrateSettings(v1, 1)).toEqual({ ...defaultSettings(), timeDisplay: 'server' });
    expect(migrateSettings(v1, 1).chosenVersionId).toBeNull();
  });
});

describe('localeWeekStart', () => {
  it('reads the week start from the locale, defaulting to Monday', () => {
    expect(localeWeekStart('en-US')).toBe(0);
    expect(localeWeekStart('en-GB')).toBe(1);
    expect(localeWeekStart('not a locale!')).toBe(1);
  });

  it('supports the Safari `weekInfo` property when getWeekInfo() is missing', () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const original = Object.getOwnPropertyDescriptor(proto, 'getWeekInfo');
    delete proto.getWeekInfo;
    Object.defineProperty(proto, 'weekInfo', {
      configurable: true,
      get(this: Intl.Locale) {
        return { firstDay: this.region === 'US' ? 7 : 1 };
      },
    });
    try {
      expect(localeWeekStart('en-US')).toBe(0);
      expect(localeWeekStart('de-DE')).toBe(1);
    } finally {
      delete proto.weekInfo;
      if (original) Object.defineProperty(proto, 'getWeekInfo', original);
    }
  });
});
