import type { DateRange, EventCatalog, Occurrence, Rarity } from '@/domain/types';
import { dayRange, intersects, type LocalDate } from './time';

export const RARITY_WEIGHT: Record<Rarity, number> = {
  once: 5,
  annual: 4,
  seasonal: 3,
  monthly: 2,
  weekly: 1,
};

/**
 * Orders occurrences from most to least dominant (PLAN.md §6). Tie-breakers in order:
 * rarity weight, definition priority, shorter duration, earlier start, event id.
 */
export function compareDominance(catalog: EventCatalog) {
  return (a: Occurrence, b: Occurrence): number => {
    const defA = catalog[a.eventId];
    const defB = catalog[b.eventId];
    const rarity =
      (defB ? RARITY_WEIGHT[defB.rarity] : 0) - (defA ? RARITY_WEIGHT[defA.rarity] : 0);
    if (rarity) return rarity;
    const priority = (defB?.priority ?? 0) - (defA?.priority ?? 0);
    if (priority) return priority;
    const duration = a.end.getTime() - a.start.getTime() - (b.end.getTime() - b.start.getTime());
    if (duration) return duration;
    const start = a.start.getTime() - b.start.getTime();
    if (start) return start;
    return a.eventId.localeCompare(b.eventId);
  };
}

/** The occurrence that styles the day, or null when nothing is active (→ version base theme). */
export function pickDominant(
  occurrencesOnDay: Occurrence[],
  catalog: EventCatalog,
): Occurrence | null {
  if (occurrencesOnDay.length === 0) return null;
  return [...occurrencesOnDay].sort(compareDominance(catalog))[0] ?? null;
}

/** Occurrences intersecting a range, ordered most dominant first. */
export function occurrencesIn(
  occurrences: Occurrence[],
  range: DateRange,
  catalog: EventCatalog,
): Occurrence[] {
  return occurrences.filter((o) => intersects(o, range)).sort(compareDominance(catalog));
}

/** Occurrences intersecting a calendar day in the user's time zone, most dominant first. */
export function occurrencesOnDay(
  occurrences: Occurrence[],
  date: LocalDate,
  timeZone: string,
  catalog: EventCatalog,
): Occurrence[] {
  return occurrencesIn(occurrences, dayRange(date, timeZone), catalog);
}

/** Milliseconds of `occurrence` that fall inside `range`. */
function overlapMs(occurrence: DateRange, range: DateRange): number {
  const start = Math.max(occurrence.start.getTime(), range.start.getTime());
  const end = Math.min(occurrence.end.getTime(), range.end.getTime());
  return Math.max(0, end - start);
}

/**
 * The event that runs longest inside `range` (e.g. a month), summing all of its occurrences and
 * counting only the time inside the range. Ties go to the more dominant event (rarity, priority,
 * then id). Null when nothing runs in the range (→ version base theme).
 */
export function pickLongestEvent(
  occurrences: Occurrence[],
  range: DateRange,
  catalog: EventCatalog,
): string | null {
  const totals = new Map<string, number>();
  for (const o of occurrences) {
    const ms = overlapMs(o, range);
    if (ms > 0) totals.set(o.eventId, (totals.get(o.eventId) ?? 0) + ms);
  }
  const rank = (id: string) => {
    const def = catalog[id];
    return { rarity: def ? RARITY_WEIGHT[def.rarity] : 0, priority: def?.priority ?? 0 };
  };
  const [longest] = [...totals].sort(([idA, msA], [idB, msB]) => {
    const a = rank(idA);
    const b = rank(idB);
    return msB - msA || b.rarity - a.rarity || b.priority - a.priority || idA.localeCompare(idB);
  });
  return longest?.[0] ?? null;
}
