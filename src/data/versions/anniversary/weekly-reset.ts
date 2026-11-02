import type { WeeklyReset } from '../../weekly-reset';

/**
 * Weekly reset per region, in server time (us: America/Los_Angeles, eu: Europe/Paris).
 *
 * TODO: not verified. Nothing in this repo states it, and no official Anniversary-specific source
 * was found (Nov 2026): fan calendars only say resets follow server time, retail figures may not
 * apply. Fill a region with { weekday, time, source } once Blizzard or the in-game calendar
 * confirms it; until then that region shows no reset event.
 */
export const WEEKLY_RESET: Record<'us' | 'eu', WeeklyReset | null> = {
  us: null,
  eu: null,
};
