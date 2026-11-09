/**
 * Wowhead's WoW: Forever world events (https://www.wowhead.com/forever/events#holidays), from a
 * raw export of the page's `g_listviews.holidays.data` to a normalized snapshot the app reads.
 * Pure functions; the file I/O is in scripts/sync-wowhead-forever.ts.
 *
 * Why an export and not a fetch: Wowhead's terms (ZAM/Fanbyte EULA §8) don't allow robots,
 * crawlers or data mining tools other than generally available browsers, and its CDN blocks
 * non-browser clients. A person exports the data from the page in their own browser
 * (docs/wowhead-sync.md); everything after that is offline and reproducible.
 */
import { z } from 'zod';
import { wallTimeToInstant } from '../../src/engine/time';

export const WOWHEAD_EVENTS_URL = 'https://www.wowhead.com/forever/events#holidays';

/** The feed's naive "YYYY/MM/DD HH:mm:ss" times are wall-clock time in this zone (verified per run). */
export const SOURCE_TIME_ZONE = 'America/Los_Angeles';

const wallTime = z.string().regex(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/, 'YYYY/MM/DD HH:mm:ss');

/** One entry of `g_listviews.holidays.data` (fields we use; others are ignored). */
export const rawEntrySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  duration0: z.number().nonnegative().optional(),
  occurrences: z.array(z.object({ start: wallTime, end: wallTime })).default([]),
});
export const rawFeedSchema = z.array(rawEntrySchema).min(1, 'the export has no entries');
export type RawEntry = z.infer<typeof rawEntrySchema>;

export interface SnapshotOccurrence {
  start: string; // UTC, "YYYY-MM-DDTHH:mm:ssZ"
  end: string;
}

export interface SnapshotEvent {
  sourceId: number;
  name: string;
  durationHours?: number;
  occurrences: SnapshotOccurrence[];
}

export interface WowheadSnapshot {
  source: string;
  sourceTimeZone: string;
  /** Events with dates. */
  events: SnapshotEvent[];
  /** Named events Wowhead lists without any dates: the app keeps its own dates for these. */
  withoutDates: { sourceId: number; name: string }[];
  /** "[#id]" placeholders with no name in data/wowhead/event-names.json: not imported. */
  unresolved: { sourceId: number; occurrences: number }[];
}

const PLACEHOLDER = /^\[#\d+\]$/;

/** "2026/11/03 07:00:00" in `timeZone` → "2026-11-03T15:00:00Z". */
export function toUtc(wall: string, timeZone = SOURCE_TIME_ZONE): string {
  const [date = '', time = ''] = wall.split(' ');
  const local = `${date.replace(/\//g, '-')}T${time.slice(0, 5)}`;
  return wallTimeToInstant(local, timeZone).toISOString().replace('.000Z', 'Z');
}

/**
 * Confirms the feed's time zone from the data itself: the new battleground holiday weeks (Call to
 * Arms, one week each) start at the US weekly reset, Tuesday 15:00 UTC. Read in `timeZone`, every
 * start must land there, on both sides of a DST change; a fixed offset or a European DST rule
 * would put some of them an hour off. Throws when it doesn't hold or can't be shown.
 */
export function verifySourceTimeZone(feed: RawEntry[], timeZone = SOURCE_TIME_ZONE): void {
  const starts = feed
    .filter((e) => e.name.startsWith('Call to Arms: ') && e.duration0 === 168)
    .flatMap((e) => e.occurrences.map((o) => o.start));
  const offsets = new Set<string>();
  for (const start of starts) {
    const utc = new Date(toUtc(start, timeZone));
    if (utc.getUTCDay() !== 2 || utc.getUTCHours() !== 15 || utc.getUTCMinutes() !== 0) {
      throw new Error(
        `Time zone check failed: Call to Arms starting "${start}" read in ${timeZone} is ${utc.toISOString()}, not Tuesday 15:00 UTC (the US weekly reset).`,
      );
    }
    offsets.add(start.slice(11, 13)); // the wall-clock hour differs across DST (07 vs 08)
  }
  if (offsets.size < 2) {
    throw new Error(
      `Time zone check inconclusive: need weekly Call to Arms starts on both sides of a US DST change (found ${starts.length}).`,
    );
  }
}

const byStart = (a: SnapshotOccurrence, b: SnapshotOccurrence) =>
  a.start.localeCompare(b.start) || a.end.localeCompare(b.end);

/** Raw feed → snapshot: UTC times, placeholders resolved by `names` (or listed), deduped, sorted. */
export function normalizeFeed(
  feed: RawEntry[],
  names: Record<string, string>,
  timeZone = SOURCE_TIME_ZONE,
): WowheadSnapshot {
  const events = new Map<number, SnapshotEvent>();
  const withoutDates = new Map<number, string>();
  const unresolved = new Map<number, number>();

  for (const entry of feed) {
    const name = PLACEHOLDER.test(entry.name) || !entry.name ? names[entry.id] : entry.name;
    if (!name) {
      unresolved.set(entry.id, (unresolved.get(entry.id) ?? 0) + entry.occurrences.length);
      continue;
    }
    if (entry.occurrences.length === 0) {
      if (!events.has(entry.id)) withoutDates.set(entry.id, name);
      continue;
    }
    withoutDates.delete(entry.id);
    const event = events.get(entry.id) ?? {
      sourceId: entry.id,
      name,
      ...(entry.duration0 !== undefined && { durationHours: entry.duration0 }),
      occurrences: [],
    };
    for (const o of entry.occurrences) {
      const occurrence = { start: toUtc(o.start, timeZone), end: toUtc(o.end, timeZone) };
      if (occurrence.end <= occurrence.start)
        throw new Error(`event ${entry.id}: occurrence ends before it starts (${o.start})`);
      if (!event.occurrences.some((x) => x.start === occurrence.start && x.end === occurrence.end))
        event.occurrences.push(occurrence);
    }
    event.occurrences.sort(byStart);
    events.set(entry.id, event);
  }

  return {
    source: WOWHEAD_EVENTS_URL,
    sourceTimeZone: timeZone,
    events: [...events.values()].sort((a, b) => a.sourceId - b.sourceId),
    withoutDates: [...withoutDates]
      .map(([sourceId, name]) => ({ sourceId, name }))
      .sort((a, b) => a.sourceId - b.sourceId),
    unresolved: [...unresolved]
      .map(([sourceId, occurrences]) => ({ sourceId, occurrences }))
      .sort((a, b) => a.sourceId - b.sourceId),
  };
}

/**
 * Refuses a snapshot that looks broken next to the last good one: no dated events at all, or a
 * sharp drop (fewer than `minShare` of the dated events or occurrences it had).
 */
export function checkAgainstPrevious(
  next: WowheadSnapshot,
  previous: WowheadSnapshot | undefined,
  minShare = 0.7,
): void {
  const count = (s: WowheadSnapshot) => ({
    events: s.events.length,
    occurrences: s.events.reduce((n, e) => n + e.occurrences.length, 0),
  });
  const now = count(next);
  if (now.events === 0)
    throw new Error('The export has no dated events; keeping the last snapshot.');
  if (!previous) return;
  const before = count(previous);
  for (const key of ['events', 'occurrences'] as const) {
    if (now[key] < before[key] * minShare)
      throw new Error(
        `Sharp drop in ${key}: ${before[key]} → ${now[key]}. Keeping the last snapshot; rerun with --allow-drop if this is real.`,
      );
  }
}

/** Stable JSON (2-space indent, trailing newline): the same input always gives the same bytes. */
export function serializeSnapshot(snapshot: WowheadSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}
