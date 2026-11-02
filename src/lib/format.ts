/** Display formatting. English UI with 24-hour times (matching in-game server clocks). */
import type { LocalDate } from '@/engine/time';

const LOCALE = 'en-US';
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = timeZone + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, { timeZone, hourCycle: 'h23', ...options });
    cache.set(key, f);
  }
  return f;
}

/** Parts for the big date numeral. Calendar dates are zone-less, so format them as UTC. */
export function dayParts(date: LocalDate) {
  const d = new Date(`${date}T00:00:00Z`);
  return {
    weekday: fmt('UTC', { weekday: 'long' }).format(d),
    day: d.getUTCDate(),
    month: fmt('UTC', { month: 'long' }).format(d),
    year: d.getUTCFullYear(),
  };
}

/** "Tue, Oct 27" */
export function formatDay(date: LocalDate): string {
  return fmt('UTC', { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** "Sunday, November 15" */
export function formatDayLong(date: LocalDate): string {
  return fmt('UTC', { weekday: 'long', month: 'long', day: 'numeric' }).format(utcDate(date));
}

/** "Mon" */
export function weekdayShort(date: LocalDate): string {
  return fmt('UTC', { weekday: 'short' }).format(utcDate(date));
}

/** "October 2026" for "2026-10" */
export function formatMonth(month: string): string {
  return fmt('UTC', { month: 'long', year: 'numeric' }).format(utcDate(`${month}-01`));
}

/** "Oct 26 – Nov 1, 2026" */
export function formatDateSpan(from: LocalDate, to: LocalDate): string {
  return fmt('UTC', { month: 'short', day: 'numeric', year: 'numeric' })
    .formatRange(utcDate(from), utcDate(to))
    .replace(/\s*[–-]\s*/, ' – ');
}

function utcDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** "Sun, Oct 18, 10:00". Date and time are formatted separately: engines join them differently. */
export function formatDateTime(instant: Date, timeZone: string): string {
  const date = fmt(timeZone, { weekday: 'short', month: 'short', day: 'numeric' }).format(instant);
  return `${date}, ${formatTime(instant, timeZone)}`;
}

/** "14:00" */
export function formatTime(instant: Date, timeZone: string): string {
  return fmt(timeZone, { hour: '2-digit', minute: '2-digit' }).format(instant);
}

/** "Sun, Oct 25, 14:00–16:00" on one day, otherwise "Sun, Oct 18, 10:00 – Sun, Nov 1, 10:00". */
export function formatRange(start: Date, end: Date, timeZone: string): string {
  // A moment rather than a span (e.g. the weekly reset): "Wed, Nov 4, 08:00".
  if (end.getTime() - start.getTime() <= MINUTE_MS) return formatDateTime(start, timeZone);
  const day = fmt(timeZone, { year: 'numeric', month: 'numeric', day: 'numeric' });
  if (day.format(start) === day.format(end)) {
    return `${formatDateTime(start, timeZone)}–${formatTime(end, timeZone)}`;
  }
  return `${formatDateTime(start, timeZone)} – ${formatDateTime(end, timeZone)}`;
}

/** Short zone label for the given instant, e.g. "GMT+1", "PST". */
export function zoneLabel(instant: Date, timeZone: string): string {
  return (
    fmt(timeZone, { timeZoneName: 'short' })
      .formatToParts(instant)
      .find((p) => p.type === 'timeZoneName')?.value ?? timeZone
  );
}

/** Compact duration: "4d 22h", "3h 12m", "12m", "<1m". */
export function formatDuration(ms: number): string {
  const abs = Math.max(0, ms);
  if (abs >= DAY_MS) {
    const d = Math.floor(abs / DAY_MS);
    const h = Math.floor((abs % DAY_MS) / HOUR_MS);
    return h ? `${d}d ${h}h` : `${d}d`;
  }
  if (abs >= HOUR_MS) {
    const h = Math.floor(abs / HOUR_MS);
    const m = Math.floor((abs % HOUR_MS) / MINUTE_MS);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (abs >= MINUTE_MS) return `${Math.floor(abs / MINUTE_MS)}m`;
  return '<1m';
}

/** Coarse distance for "Coming soon": "6d", "5h", "<1h". */
export function formatDistance(ms: number): string {
  if (ms >= DAY_MS) return `${Math.floor(ms / DAY_MS)}d`;
  if (ms >= HOUR_MS) return `${Math.floor(ms / HOUR_MS)}h`;
  return '<1h';
}
