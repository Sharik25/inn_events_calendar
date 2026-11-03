import type { AnnualAnchor, ExplicitOccurrence } from '@/domain/types';
import {
  addDays,
  intersects,
  localDateOf,
  nthWeekdayOfMonth,
  wallTimeToInstant,
  type LocalDate,
} from '../time';
import type { RawOccurrence, RuleExpander } from './types';

/**
 * Lunar New Year (first day of the Chinese calendar year). The Lunar Festival follows it. Years not
 * listed have no estimate rather than a guess; extend the table to estimate further ahead.
 */
export const LUNAR_NEW_YEAR: Readonly<Record<number, LocalDate>> = {
  2025: '2025-01-29',
  2026: '2026-02-17',
  2027: '2027-02-06',
  2028: '2028-01-26',
  2029: '2029-02-13',
  2030: '2030-02-03',
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Western (Gregorian) Easter Sunday, by the anonymous Gregorian algorithm. */
export function easterSunday(year: number): LocalDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The day an annual holiday starts in `year`, or null when it can't be derived (no data). */
export function annualStartDate(anchor: AnnualAnchor, year: number): LocalDate | null {
  switch (anchor.type) {
    case 'date':
      return `${year}-${pad(anchor.month)}-${pad(anchor.day)}`;
    case 'weekday':
      return nthWeekdayOfMonth(`${year}-${pad(anchor.month)}`, anchor.weekday, anchor.nth);
    case 'easter':
      return addDays(easterSunday(year), anchor.offsetDays);
    case 'lunar-new-year': {
      const newYear = LUNAR_NEW_YEAR[year];
      return newYear ? addDays(newYear, anchor.offsetDays) : null;
    }
  }
}

function fromOverride(o: ExplicitOccurrence, timeZone: string): RawOccurrence {
  return {
    start: wallTimeToInstant(o.start, timeZone),
    end: wallTimeToInstant(o.end, timeZone),
    verified: o.verified,
    ...(o.source && { source: o.source }),
    ...(o.note && { note: o.note }),
    ...(o.location && { location: o.location }),
  };
}

/**
 * Once a year, from the anchor. A year with an override (a real date for this version) uses it
 * instead; other years are the rule's estimate, flagged `estimated` when the rule says so.
 */
export const expandAnnual: RuleExpander<'annual'> = (rule, { timeZone, range }) => {
  // One year early too: a holiday can run into the next year (Winter Veil).
  const first = Number(localDateOf(range.start, timeZone).slice(0, 4)) - 1;
  const last = Number(localDateOf(range.end, timeZone).slice(0, 4));

  const result: RawOccurrence[] = [];
  for (let year = first; year <= last; year++) {
    const override = rule.overrides?.find((o) => o.start.startsWith(`${year}-`));
    let occurrence: RawOccurrence;
    if (override) {
      occurrence = fromOverride(override, timeZone);
    } else {
      const day = annualStartDate(rule.anchor, year);
      if (!day) continue;
      occurrence = {
        // Days are added on the wall clock, so DST never moves the server start/end time.
        start: wallTimeToInstant(`${day}T${rule.startTime}`, timeZone),
        end: wallTimeToInstant(`${addDays(day, rule.durationDays)}T${rule.startTime}`, timeZone),
        verified: rule.verified,
        ...(rule.estimated && { estimated: true }),
        ...(rule.source && { source: rule.source }),
        ...(rule.note && { note: rule.note }),
      };
    }
    if (intersects(occurrence, range)) result.push(occurrence);
  }
  return result;
};
