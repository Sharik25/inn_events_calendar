import type { Occurrence } from '@/domain/types';
import { strings } from '@/strings';

type Dated = Pick<Occurrence, 'verified' | 'estimated'>;

/** Short tag for a date that isn't confirmed: "Estimated" or "Unconfirmed"; null when confirmed. */
export function dateStatusLabel(o: Dated): string | null {
  if (o.verified) return null;
  return o.estimated ? strings.common.estimated : strings.common.unconfirmed;
}

/** Why the date isn't confirmed, for the tag's info tip. */
export function dateStatusHint(o: Dated): string {
  if (o.estimated === 'weekly') return strings.common.estimatedWeeklyHint;
  return o.estimated ? strings.common.estimatedHint : strings.common.unconfirmedHint;
}
