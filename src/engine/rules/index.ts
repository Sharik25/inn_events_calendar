import type { ScheduleRule, ScheduleRuleKind } from '@/domain/types';
import { expandAnnual } from './annual';
import { expandExplicit } from './explicit';
import { expandMonthly } from './monthly';
import { expandWeekly } from './weekly';
import type { ExpandContext, RawOccurrence, RuleExpander } from './types';

export type { ExpandContext, RawOccurrence, RuleExpander } from './types';

/** Rule registry: kind → expander. A new rule kind is one schema variant + one line here. */
export const ruleExpanders: { [K in ScheduleRuleKind]: RuleExpander<K> } = {
  explicit: expandExplicit,
  annual: expandAnnual,
  weekly: expandWeekly,
  monthly: expandMonthly,
};

export function expandRule(rule: ScheduleRule, ctx: ExpandContext): RawOccurrence[] {
  const expander = ruleExpanders[rule.kind] as RuleExpander<typeof rule.kind>;
  return expander(rule as never, ctx);
}
