import { useMemo } from 'react';
import { Link } from 'react-router';
import { useVersionView } from '@/app/versionView';
import type { Occurrence } from '@/domain/types';
import { isShortEvent, layoutRibbons, occurrencesByDay, weekDays } from '@/engine/calendar';
import type { LocalDate } from '@/engine/time';
import { DayAccent } from '@/features/calendar/DayAccent';
import { EventChip } from '@/features/calendar/EventChip';
import { PeriodHeader } from '@/features/calendar/PeriodHeader';
import { useDayThemeId } from '@/features/calendar/useDayTheme';
import { RoutedEventSheet } from '@/features/event-sheet/RoutedEventSheet';
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { useOccurrences } from '@/hooks/useOccurrences';
import { formatDateSpan, formatDayLong, weekdayShort } from '@/lib/format';
import { strings } from '@/strings';
import { ThemeScope } from '@/ui';
import styles from './WeekView.module.css';

/** `/:versionId/week/:date`: list of days on mobile, 7-column grid with ribbons on desktop. */
export function WeekView() {
  const { version, catalog, region, userTimeZone, viewDate, weekStartsOn, hiddenCategories } =
    useVersionView();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  const days = useMemo(() => weekDays(viewDate, weekStartsOn), [viewDate, weekStartsOn]);
  const first = days[0] ?? viewDate;
  const last = days[6] ?? viewDate;
  const occurrences = useOccurrences(
    version,
    region.id,
    first,
    last,
    userTimeZone,
    catalog,
    hiddenCategories,
  );
  const byDay = useMemo(
    () => occurrencesByDay(occurrences, days, userTimeZone, catalog),
    [occurrences, days, userTimeZone, catalog],
  );

  return (
    <div className={styles.view}>
      <PeriodHeader
        title={formatDateSpan(first, last)}
        prevLabel={strings.calendar.previousWeek}
        nextLabel={strings.calendar.nextWeek}
        currentLabel={strings.calendar.thisWeek}
      />
      {isDesktop ? (
        <WeekGrid days={days} occurrences={occurrences} byDay={byDay} />
      ) : (
        <WeekList days={days} byDay={byDay} />
      )}
      <RoutedEventSheet />
    </div>
  );
}

function DayHeading({ date, compact = false }: { date: LocalDate; compact?: boolean }) {
  const { hrefFor, today } = useVersionView();
  return (
    <Link
      to={hrefFor('day', date)}
      className={compact ? styles.dayLinkCompact : styles.dayLink}
      aria-label={formatDayLong(date)}
      aria-current={date === today ? 'date' : undefined}
    >
      <span className={styles.weekday}>{weekdayShort(date)}</span>
      <span className={styles.numeral}>{Number(date.slice(8))}</span>
    </Link>
  );
}

function WeekList({ days, byDay }: { days: LocalDate[]; byDay: Map<LocalDate, Occurrence[]> }) {
  const { today } = useVersionView();
  const themeFor = useDayThemeId();
  return (
    <ol className={styles.list}>
      {days.map((date) => {
        const events = byDay.get(date) ?? [];
        const themeId = themeFor(events);
        return (
          <li key={date} className={styles.row} data-today={date === today || undefined}>
            <ThemeScope themeId={themeId} className={styles.dayBox}>
              <DayHeading date={date} compact />
              <DayAccent themeId={themeId} />
            </ThemeScope>
            {events.length > 0 ? (
              <ul className={styles.chips}>
                {events.map((o) => (
                  <li key={o.key}>
                    <EventChip occurrence={o} date={date} />
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.empty}>{strings.calendar.noEvents}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function WeekGrid({
  days,
  occurrences,
  byDay,
}: {
  days: LocalDate[];
  occurrences: Occurrence[];
  byDay: Map<LocalDate, Occurrence[]>;
}) {
  const { catalog, userTimeZone, today } = useVersionView();
  const themeFor = useDayThemeId();
  const ribbons = layoutRibbons(
    occurrences.filter((o) => !isShortEvent(o)),
    days,
    userTimeZone,
    catalog,
  );

  return (
    <div className={styles.grid}>
      {days.map((date, i) => {
        const themeId = themeFor(byDay.get(date));
        return (
          <ThemeScope
            key={date}
            themeId={themeId}
            className={styles.head}
            style={{ gridColumn: i + 1 }}
            data-today={date === today || undefined}
          >
            <DayHeading date={date} />
            <DayAccent themeId={themeId} />
          </ThemeScope>
        );
      })}

      <div className={styles.ribbons}>
        {ribbons.map((seg) => (
          <EventChip
            key={seg.occurrence.key}
            occurrence={seg.occurrence}
            date={days[seg.startCol] ?? days[0] ?? ''}
            variant="ribbon"
            continuesBefore={seg.continuesBefore}
            continuesAfter={seg.continuesAfter}
            style={{ gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`, gridRow: seg.lane + 1 }}
          />
        ))}
      </div>

      {days.map((date, i) => (
        <div key={date} className={styles.timed} style={{ gridColumn: i + 1 }}>
          {(byDay.get(date) ?? []).filter(isShortEvent).map((o) => (
            <EventChip key={o.key} occurrence={o} date={date} variant="block" />
          ))}
        </div>
      ))}
    </div>
  );
}
