import { intersects } from '../time';
import type { RuleExpander } from './types';

/** One absolute instant, the same in every region (the time zone doesn't apply). */
export const expandMoment: RuleExpander<'moment'> = (rule, { range }) => {
  const start = new Date(rule.at);
  const occurrence = {
    start,
    end: new Date(start.getTime() + rule.durationMinutes * 60_000),
    verified: rule.verified,
    ...(rule.source && { source: rule.source }),
    ...(rule.note && { note: rule.note }),
  };
  return intersects(occurrence, range) ? [occurrence] : [];
};
