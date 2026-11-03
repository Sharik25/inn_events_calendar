import { intersects, wallTimeToInstant } from '../time';
import type { RuleExpander } from './types';

export const expandExplicit: RuleExpander<'explicit'> = (rule, { timeZone, range }) =>
  rule.occurrences
    .map((o) => ({
      start: wallTimeToInstant(o.start, timeZone),
      end: wallTimeToInstant(o.end, timeZone),
      verified: o.verified,
      ...(o.source && { source: o.source }),
      ...(o.note && { note: o.note }),
      ...(o.location && { location: o.location }),
    }))
    .filter((o) => intersects(o, range));
