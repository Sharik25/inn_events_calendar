import type { DateRange, ScheduleRule, ScheduleRuleKind } from '@/domain/types';

/** A rule expanded into absolute instants, before ids/keys are attached. */
export interface RawOccurrence {
  start: Date;
  end: Date;
  verified: boolean;
  location?: string;
  source?: string;
  note?: string;
  estimated?: boolean;
}

export interface ExpandContext {
  /** Server time zone of the region the rule is defined in. */
  timeZone: string;
  /** Only occurrences intersecting this range are returned. */
  range: DateRange;
}

export type RuleExpander<K extends ScheduleRuleKind> = (
  rule: Extract<ScheduleRule, { kind: K }>,
  ctx: ExpandContext,
) => RawOccurrence[];
