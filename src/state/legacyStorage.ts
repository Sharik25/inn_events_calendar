/**
 * Storage keys of features that were removed. Cleared on load so they don't linger on devices;
 * once a key is gone this does nothing. Other saved data (settings) is left alone.
 */
export const REMOVED_STORAGE_KEYS: readonly string[] = [
  'almanac-checklist', // the holiday checklist (removed November 2026)
];

export function removeLegacyStorage(): void {
  for (const key of REMOVED_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable (private mode, disabled): nothing to clean up.
    }
  }
}
