import type {
  EventDefinition,
  EventId,
  ExplicitOccurrence,
  ScheduleFile,
  ScheduleRule,
  VersionEventBinding,
} from '@/domain/types';

/** Note on every estimated date (shown in the event sheet and written into .ics descriptions). */
export const ESTIMATED_NOTE =
  'Date estimated from the standard yearly schedule; not confirmed for this version yet. Time of day assumed (10:00 server time).';

/** Note on every estimated weekly occurrence (e.g. the fishing contest). */
export const ESTIMATED_WEEKLY_NOTE =
  'Time estimated from the standard weekly schedule; not confirmed for this version yet.';

/**
 * The weekly rule for an event's standard weekly slot, with this version's status: confirmed with
 * a source for this version, or estimated. Keeps the day/time/duration in one place (the event).
 */
export function standardWeeklyRule(
  def: EventDefinition,
  status: { verified: true; source: string } | { verified: false },
): Extract<ScheduleRule, { kind: 'weekly' }> {
  if (!def.weekly) throw new Error(`event "${def.id}" has no weekly slot`);
  const { weekday, startTime, durationMinutes, source } = def.weekly;
  return status.verified
    ? { kind: 'weekly', weekday, startTime, durationMinutes, verified: true, source: status.source }
    : {
        kind: 'weekly',
        weekday,
        startTime,
        durationMinutes,
        verified: false,
        estimated: true,
        source,
        note: ESTIMATED_WEEKLY_NOTE,
      };
}

/** Explicit dates per event from a version's `schedule-<year>.json` files, oldest first. */
function datesByEvent(files: ScheduleFile[]): Map<EventId, ExplicitOccurrence[]> {
  const byEvent = new Map<EventId, ExplicitOccurrence[]>();
  for (const file of [...files].sort((a, b) => a.year - b.year)) {
    for (const [eventId, occurrences] of Object.entries(file.events)) {
      byEvent.set(eventId, [...(byEvent.get(eventId) ?? []), ...occurrences]);
    }
  }
  for (const [eventId, list] of byEvent) {
    byEvent.set(
      eventId,
      [...list].sort((a, b) => a.start.localeCompare(b.start)),
    );
  }
  return byEvent;
}

/**
 * Turns a version's `schedule-<year>.json` files into explicit-rule bindings, one per event.
 * Adding a year of dates is just adding a file: version configs glob them.
 */
export function explicitBindingsFromSchedules(files: ScheduleFile[]): VersionEventBinding[] {
  return [...datesByEvent(files)].map(([eventId, occurrences]) => ({
    eventId,
    rule: { kind: 'explicit', occurrences },
  }));
}

export interface ScheduleOptions {
  /** The event catalog (needed to know which events have a standard yearly slot). */
  events: EventDefinition[];
  /**
   * Estimate every event with a standard slot, marked "Estimated": holidays with an `annual` slot
   * (for years the files don't cover) and recurring events with a `weekly` slot. Off: only the
   * files' dates (a version whose calendar is tracked by hand).
   */
  estimateStandard?: boolean;
  /** Events this version doesn't have. */
  disabled?: EventId[];
}

/**
 * A version's dated events, declaratively: its own `schedule-<year>.json` dates (the per-version
 * overrides, with their own verified flag and source), plus, with `estimateStandard`, every yearly
 * holiday estimated from the standard schedule wherever the files have no date for that year, and
 * every weekly event estimated from its standard weekly slot.
 */
export function scheduleBindings(
  files: ScheduleFile[],
  { events, estimateStandard = false, disabled = [] }: ScheduleOptions,
): VersionEventBinding[] {
  const dates = datesByEvent(files);
  const off = new Set(disabled);
  const bindings: VersionEventBinding[] = [];

  if (estimateStandard) {
    for (const def of events) {
      if (def.weekly && !def.annual && !dates.has(def.id) && !off.has(def.id)) {
        bindings.push({ eventId: def.id, rule: standardWeeklyRule(def, { verified: false }) });
      }
    }
    for (const def of events) {
      if (!def.annual || off.has(def.id)) continue;
      const { anchor, startTime, durationDays, source } = def.annual;
      bindings.push({
        eventId: def.id,
        rule: {
          kind: 'annual',
          anchor,
          startTime,
          durationDays,
          verified: false,
          estimated: true,
          source,
          note: ESTIMATED_NOTE,
          ...(dates.has(def.id) && { overrides: dates.get(def.id) }),
        },
      });
      dates.delete(def.id);
    }
  }
  for (const [eventId, occurrences] of dates) {
    if (!off.has(eventId)) bindings.push({ eventId, rule: { kind: 'explicit', occurrences } });
  }
  return bindings;
}

/** Eager glob result → schedule files. */
export function scheduleFilesFromGlob(modules: Record<string, ScheduleFile>): ScheduleFile[] {
  return Object.values(modules);
}
