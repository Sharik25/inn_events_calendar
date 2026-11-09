import { removeLegacyStorage } from './legacyStorage';
import { SETTINGS_STORAGE_KEY } from './settings';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('removeLegacyStorage', () => {
  it('removes the keys of removed features and keeps the rest', () => {
    localStorage.setItem('almanac-checklist', '{"version":1,"done":{}}');
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{"state":{}}');
    removeLegacyStorage();
    expect(localStorage.getItem('almanac-checklist')).toBeNull();
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBe('{"state":{}}');
  });

  it('does nothing when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => removeLegacyStorage()).not.toThrow();
  });
});
