import type { EventCatalog, EventCategory, Occurrence } from '@/domain/types';
import { occurrencesOnDay } from './dominance';
import { addDays, dayRange, intersects, type LocalDate } from './time';

export interface DayAgenda {
  date: LocalDate;
  /** Occurrences intersecting the day, most dominant first. */
  active: Occurrence[];
  dominant: Occurrence | null;
  /** First upcoming occurrence of each event not active that day, starting within the horizon. */
  comingSoon: Occurrence[];
}

/** Drops occurrences whose event is in a hidden category (or missing from the catalog). */
export function filterByCategory(
  occurrences: Occurrence[],
  catalog: EventCatalog,
  hidden: readonly EventCategory[],
): Occurrence[] {
  if (hidden.length === 0) return occurrences.filter((o) => catalog[o.eventId]);
  const hiddenSet = new Set(hidden);
  return occurrences.filter((o) => {
    const def = catalog[o.eventId];
    return def && !hiddenSet.has(def.category);
  });
}

/** What's on for a calendar day in the user's time zone (Today view). */
export function buildDayAgenda(
  occurrences: Occurrence[],
  date: LocalDate,
  timeZone: string,
  catalog: EventCatalog,
  horizonDays = 30,
): DayAgenda {
  const active = occurrencesOnDay(occurrences, date, timeZone, catalog);
  const activeIds = new Set(active.map((o) => o.eventId));
  const from = dayRange(date, timeZone).end;
  const until = dayRange(addDays(date, horizonDays), timeZone).end;

  const seen = new Set<string>();
  const comingSoon = occurrences
    .filter((o) => o.start >= from && o.start < until && !activeIds.has(o.eventId))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .filter((o) => !seen.has(o.eventId) && seen.add(o.eventId));

  return { date, active, dominant: active[0] ?? null, comingSoon };
}

const ONE_DAY_MS = 86_400_000;

/** Lasts a day or less (a fishing contest, New Year's Eve), as opposed to a multi-day event. */
export function isOneDay(occurrence: Pick<Occurrence, 'start' | 'end'>): boolean {
  return occurrence.end.getTime() - occurrence.start.getTime() <= ONE_DAY_MS;
}

/**
 * One-day occurrences of other events that run during the long-running `occurrence`, earliest
 * first: the extras a calendar export can include. Empty when `occurrence` is itself one-day.
 */
export function oneDayOverlaps(occurrences: Occurrence[], occurrence: Occurrence): Occurrence[] {
  if (isOneDay(occurrence)) return [];
  const seen = new Set<string>();
  return occurrences
    .filter(
      (o) =>
        o.eventId !== occurrence.eventId &&
        isOneDay(o) &&
        intersects(o, occurrence) &&
        !seen.has(o.key) &&
        seen.add(o.key),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.key.localeCompare(b.key));
}

export type Timing =
  | { phase: 'upcoming'; ms: number } // ms until start
  | { phase: 'active'; ms: number } // ms until end
  | { phase: 'ended'; ms: number }; // ms since end

export function timingAt(occurrence: Pick<Occurrence, 'start' | 'end'>, now: Date): Timing {
  const t = now.getTime();
  if (t < occurrence.start.getTime())
    return { phase: 'upcoming', ms: occurrence.start.getTime() - t };
  if (t < occurrence.end.getTime()) return { phase: 'active', ms: occurrence.end.getTime() - t };
  return { phase: 'ended', ms: t - occurrence.end.getTime() };
}

/** The occurrence of `eventId` to show for a day: active that day, else next after it, else last before it. */
export function findOccurrenceForDay(
  occurrences: Occurrence[],
  eventId: string,
  date: LocalDate,
  timeZone: string,
): Occurrence | null {
  const ofEvent = occurrences.filter((o) => o.eventId === eventId);
  const day = dayRange(date, timeZone);
  return (
    ofEvent.find((o) => o.start < day.end && o.end > day.start) ??
    ofEvent.find((o) => o.start >= day.end) ??
    ofEvent.filter((o) => o.end <= day.start).pop() ??
    null
  );
}
