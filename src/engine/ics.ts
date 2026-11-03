/**
 * Minimal RFC 5545 (iCalendar) writer: everything we export is a set of timed VEVENTs in UTC.
 * Recurring events are expanded into individual VEVENTs rather than RRULEs, so server-time
 * events keep their wall-clock time across DST changes (a UTC RRULE would drift by an hour).
 */
import type { EventDefinition, Occurrence } from '@/domain/types';
import { dayRange, localDateOf, type LocalDate } from './time';

export interface IcsEvent {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  url?: string;
  location?: string;
  categories?: string[];
  /** Reminder this many minutes before the start (a VALARM); none when omitted. */
  alarmMinutes?: number;
}

export interface IcsCalendar {
  /** Shown as the calendar's name when subscribed. */
  name?: string;
  description?: string;
  /** Suggested refresh interval for subscribed feeds. */
  refreshHours?: number;
  events: IcsEvent[];
  /** DTSTAMP for all events (defaults to now). */
  stamp?: Date;
}

export const PRODID = "-//Innkeeper's Almanac//Event Calendar//EN";
export const UID_DOMAIN = 'innkeepers-almanac';

/** 20261018T080000Z */
export function icsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** TEXT value escaping (RFC 5545 §3.3.11). */
export function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const encoder = new TextEncoder();

/** Folds a content line at 75 octets without splitting a UTF-8 character (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function prop(name: string, value: string): string {
  return foldLine(`${name}:${value}`);
}

/**
 * A display reminder `minutes` before the start (RFC 5545 §3.6.6). Apple Calendar and Outlook
 * keep it on import; Google Calendar ignores alarms in imported files and applies the user's
 * default notifications instead.
 */
export function valarm(title: string, minutes: number): string[] {
  return [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    prop('DESCRIPTION', escapeText(title)),
    `TRIGGER:-PT${Math.max(0, Math.round(minutes))}M`,
    'END:VALARM',
  ];
}

export function buildIcs(calendar: IcsCalendar): string {
  const stamp = icsDate(calendar.stamp ?? new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  if (calendar.name) {
    lines.push(
      prop('X-WR-CALNAME', escapeText(calendar.name)),
      prop('NAME', escapeText(calendar.name)),
    );
  }
  if (calendar.description) lines.push(prop('X-WR-CALDESC', escapeText(calendar.description)));
  if (calendar.refreshHours) {
    lines.push(
      `REFRESH-INTERVAL;VALUE=DURATION:PT${calendar.refreshHours}H`,
      `X-PUBLISHED-TTL:PT${calendar.refreshHours}H`,
    );
  }
  for (const e of calendar.events) {
    lines.push(
      'BEGIN:VEVENT',
      prop('UID', e.uid),
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      prop('SUMMARY', escapeText(e.title)),
    );
    if (e.description) lines.push(prop('DESCRIPTION', escapeText(e.description)));
    if (e.location) lines.push(prop('LOCATION', escapeText(e.location)));
    if (e.url) lines.push(prop('URL', e.url));
    if (e.categories?.length)
      lines.push(prop('CATEGORIES', e.categories.map(escapeText).join(',')));
    lines.push('TRANSP:TRANSPARENT');
    if (e.alarmMinutes !== undefined) lines.push(...valarm(e.title, e.alarmMinutes));
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

export interface ExportOptions {
  /** Absolute app origin for links back to the event (omit for no link). */
  appUrl?: string;
  /** Word put in front of unverified events, e.g. "tentative". */
  tentativeLabel: string;
  /** Label for the location line, e.g. "Location". */
  locationLabel: string;
}

/** Stable across rebuilds and re-imports, so calendars update instead of duplicating. */
export function occurrenceUid(occurrence: Pick<Occurrence, 'key'>): string {
  return `${occurrence.key}@${UID_DOMAIN}`;
}

/** Link back to the app's day view with the event sheet open. */
export function occurrenceAppUrl(occurrence: Occurrence, appUrl: string): string {
  const date = localDateOf(occurrence.start, 'UTC');
  return `${appUrl.replace(/\/$/, '')}/${occurrence.versionId}/day/${date}?event=${occurrence.eventId}&on=${date}`;
}

/** True when an occurrence runs on more than one calendar day in `timeZone`. */
export function spansSeveralDays(occurrence: Pick<Occurrence, 'start' | 'end'>, timeZone: string) {
  const lastInstant = new Date(occurrence.end.getTime() - 1);
  return localDateOf(occurrence.start, timeZone) !== localDateOf(lastInstant, timeZone);
}

/**
 * Only `date` (a calendar day in `timeZone`) of an occurrence, for "add this day": clipped to
 * that day, with its own key (so its own calendar UID) to sit beside the whole event instead of
 * replacing it. Null when the occurrence doesn't run that day.
 */
export function occurrenceOnDay(
  occurrence: Occurrence,
  date: LocalDate,
  timeZone: string,
): Occurrence | null {
  const day = dayRange(date, timeZone);
  const start = new Date(Math.max(occurrence.start.getTime(), day.start.getTime()));
  const end = new Date(Math.min(occurrence.end.getTime(), day.end.getTime()));
  if (start >= end) return null;
  return { ...occurrence, key: `${occurrence.key}/${date}`, start, end };
}

/** `name` replaces the event's name in the title, e.g. "Hallow's End (Tue, Oct 27)" for one day. */
export function occurrenceToIcsEvent(
  occurrence: Occurrence,
  def: EventDefinition,
  { appUrl, tentativeLabel, locationLabel }: ExportOptions,
  name = def.name,
): IcsEvent {
  const url = appUrl ? occurrenceAppUrl(occurrence, appUrl) : undefined;
  const description = [
    def.summary,
    occurrence.location && `${locationLabel}: ${occurrence.location}`,
    occurrence.note,
    url,
  ]
    .filter(Boolean)
    .join('\n\n');
  return {
    uid: occurrenceUid(occurrence),
    start: occurrence.start,
    end: occurrence.end,
    title: occurrence.verified ? name : `(${tentativeLabel}) ${name}`,
    description,
    ...(url && { url }),
    ...(occurrence.location && { location: occurrence.location }),
    categories: [def.category],
  };
}

/** Google Calendar "add event" link for one event. */
export function googleCalendarUrl(event: IcsEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsDate(event.start)}/${icsDate(event.end)}`,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
