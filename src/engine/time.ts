/**
 * Time zone helpers. Events are defined in a region's server time (wall clock);
 * the engine works with absolute instants. Calendar dates are plain "YYYY-MM-DD" strings
 * so day arithmetic never depends on the host machine's time zone.
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { DateRange, Region, Weekday } from '@/domain/types';

/** "YYYY-MM-DD" */
export type LocalDate = string;
/** "YYYY-MM" */
export type LocalMonth = string;

const DAY_MS = 86_400_000;

function parseLocalDate(date: LocalDate): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid local date "${date}" (expected YYYY-MM-DD)`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function toLocalDate(utcMidnight: number): LocalDate {
  return new Date(utcMidnight).toISOString().slice(0, 10);
}

function utcMidnight(date: LocalDate): number {
  const [y, m, d] = parseLocalDate(date);
  return Date.UTC(y, m - 1, d);
}

/** Wall-clock time in `timeZone` → absolute instant. `localIso` is "YYYY-MM-DDTHH:mm". */
export function wallTimeToInstant(localIso: string, timeZone: string): Date {
  const instant = fromZonedTime(localIso, timeZone);
  if (Number.isNaN(instant.getTime())) {
    throw new Error(`Invalid wall time "${localIso}" in ${timeZone}`);
  }
  return instant;
}

/** Absolute instant → calendar date in `timeZone`. */
export function localDateOf(instant: Date, timeZone: string): LocalDate {
  return formatInTimeZone(instant, timeZone, 'yyyy-MM-dd');
}

/** Absolute instant → "HH:mm" wall time in `timeZone`. */
export function localTimeOf(instant: Date, timeZone: string): string {
  return formatInTimeZone(instant, timeZone, 'HH:mm');
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return toLocalDate(utcMidnight(date) + days * DAY_MS);
}

/** Whole days from `a` to `b` (b − a). */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((utcMidnight(b) - utcMidnight(a)) / DAY_MS);
}

export function weekdayOf(date: LocalDate): Weekday {
  return new Date(utcMidnight(date)).getUTCDay() as Weekday;
}

export function monthOf(date: LocalDate): LocalMonth {
  return date.slice(0, 7);
}

export function addMonths(month: LocalMonth, months: number): LocalMonth {
  const [y, m] = parseLocalDate(`${month}-01`);
  const index = y * 12 + (m - 1) + months;
  const year = Math.floor(index / 12);
  const mon = index - year * 12 + 1;
  return `${String(year).padStart(4, '0')}-${String(mon).padStart(2, '0')}`;
}

/** Whole months from `a` to `b` (b − a). */
export function monthsBetween(a: LocalMonth, b: LocalMonth): number {
  const [ay, am] = parseLocalDate(`${a}-01`);
  const [by, bm] = parseLocalDate(`${b}-01`);
  return (by - ay) * 12 + (bm - am);
}

function daysInMonth(month: LocalMonth): number {
  return daysBetween(`${month}-01`, `${addMonths(month, 1)}-01`);
}

/** The nth (or last) given weekday of a month, e.g. 1st Friday of 2026-11 → "2026-11-06". */
export function nthWeekdayOfMonth(
  month: LocalMonth,
  weekday: Weekday,
  nth: 1 | 2 | 3 | 4 | 'last',
): LocalDate {
  if (nth === 'last') {
    const last = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
    return addDays(last, -((weekdayOf(last) - weekday + 7) % 7));
  }
  const first = `${month}-01`;
  return addDays(first, ((weekday - weekdayOf(first) + 7) % 7) + (nth - 1) * 7);
}

/** The absolute range covered by a calendar day in `timeZone` (23h/25h on DST switch days). */
export function dayRange(date: LocalDate, timeZone: string): DateRange {
  return {
    start: wallTimeToInstant(`${date}T00:00`, timeZone),
    end: wallTimeToInstant(`${addDays(date, 1)}T00:00`, timeZone),
  };
}

/** Absolute range covering the calendar days [from, toInclusive] in `timeZone`. */
export function daysRange(from: LocalDate, toInclusive: LocalDate, timeZone: string): DateRange {
  return { start: dayRange(from, timeZone).start, end: dayRange(toInclusive, timeZone).end };
}

/** Absolute range covering every calendar day of `month` in `timeZone`. */
export function monthRange(month: LocalMonth, timeZone: string): DateRange {
  return {
    start: dayRange(`${month}-01`, timeZone).start,
    end: dayRange(`${addMonths(month, 1)}-01`, timeZone).start,
  };
}

/** Half-open overlap test. */
export function intersects(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && a.end > b.start;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-guess region for a user's IANA time zone (PLAN.md §7):
 * Europe/Asia/Africa → EU, Americas → US, Australia/Pacific → OCE — each only if the version has it.
 */
export function guessRegionId(
  userTimeZone: string,
  regions: Region[],
  defaultRegionId: string,
): string {
  const area = userTimeZone.split('/')[0];
  const preference: Record<string, string[]> = {
    Europe: ['eu'],
    Asia: ['eu'],
    Africa: ['eu'],
    Atlantic: ['eu', 'us'],
    America: ['us'],
    US: ['us'],
    Canada: ['us'],
    Australia: ['oce', 'us'],
    Pacific: ['oce', 'us'],
  };
  const available = new Set(regions.map((r) => r.id));
  const match = (area ? preference[area] : undefined)?.find((id) => available.has(id));
  return match ?? defaultRegionId;
}
