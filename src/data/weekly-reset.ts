import type { VersionEventBinding, Weekday } from '@/domain/types';

/** A region's weekly reset, in that region's server time. */
export interface WeeklyReset {
  weekday: Weekday; // 0 = Sunday
  time: string; // "HH:mm"
  source: string; // URL that states this reset for this version and region
}

/**
 * The `weekly-reset` binding for the regions whose reset is known; none while all are unknown.
 * A region without data simply has no reset event (never another region's time).
 */
export function weeklyResetBindings(
  resets: Record<string, WeeklyReset | null>,
): VersionEventBinding[] {
  const known = Object.entries(resets).flatMap(([regionId, r]) =>
    r ? [[regionId, r] as const] : [],
  );
  const [first] = known;
  if (!first) return [];
  const rule = ({ weekday, time, source }: WeeklyReset) => ({
    kind: 'weekly' as const,
    weekday,
    startTime: time,
    durationMinutes: 1, // a moment; shown as a single time
    verified: true,
    source,
  });
  return [
    {
      eventId: 'weekly-reset',
      rule: rule(first[1]),
      regionRules: Object.fromEntries(known.map(([id, r]) => [id, rule(r)])),
      regions: known.map(([id]) => id),
    },
  ];
}
