import type { Occurrence } from '@/domain/types';
import { timingAt } from '@/engine/agenda';
import { formatDateTime, formatDuration, formatTime } from '@/lib/format';
import { strings } from '@/strings';

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/**
 * "Starts in 3h 12m" / "Ends in 4d 22h" / "Ended at 16:00"; a moment (a launch, the weekly
 * reset) that has passed: "At 15:00". Re-renders as `now` ticks.
 */
export function Countdown({
  occurrence,
  now,
  timeZone,
  className,
}: {
  occurrence: Pick<Occurrence, 'start' | 'end'>;
  now: Date;
  timeZone: string;
  className?: string;
}) {
  const timing = timingAt(occurrence, now);
  const moment = occurrence.end.getTime() - occurrence.start.getTime() <= MINUTE_MS;
  const text =
    timing.phase === 'upcoming'
      ? strings.today.startsIn(formatDuration(timing.ms))
      : moment
        ? strings.today.at(formatTime(occurrence.start, timeZone))
        : timing.phase === 'active'
          ? strings.today.endsIn(formatDuration(timing.ms))
          : strings.today.ended(
              timing.ms < DAY_MS
                ? formatTime(occurrence.end, timeZone)
                : formatDateTime(occurrence.end, timeZone),
            );
  return (
    <span className={className} data-phase={timing.phase}>
      {text}
    </span>
  );
}
