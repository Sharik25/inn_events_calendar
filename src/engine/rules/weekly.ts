import { addDays, intersects, localDateOf, wallTimeToInstant, weekdayOf } from '../time';
import type { RawOccurrence, RuleExpander } from './types';

export const expandWeekly: RuleExpander<'weekly'> = (rule, { timeZone, range }) => {
  const durationMs = rule.durationMinutes * 60_000;
  // Start early enough to catch an occurrence that began before the range but is still running.
  const from = localDateOf(new Date(range.start.getTime() - durationMs), timeZone);
  const to = localDateOf(range.end, timeZone);

  const result: RawOccurrence[] = [];
  let day = addDays(from, (rule.weekday - weekdayOf(from) + 7) % 7);
  while (day <= to) {
    const start = wallTimeToInstant(`${day}T${rule.startTime}`, timeZone);
    const occurrence = {
      start,
      end: new Date(start.getTime() + durationMs),
      verified: rule.verified,
      ...(rule.estimated && { estimated: 'weekly' as const }),
      ...(rule.source && { source: rule.source }),
      ...(rule.note && { note: rule.note }),
    };
    if (intersects(occurrence, range)) result.push(occurrence);
    day = addDays(day, 7);
  }
  return result;
};
