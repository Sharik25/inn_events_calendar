import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useVersionView } from '@/app/versionView';
import type { Occurrence } from '@/domain/types';
import { layoutRibbons, monthWeeks, occurrencesByDay } from '@/engine/calendar';
import { monthOf, type LocalDate } from '@/engine/time';
import { DaySheet } from '@/features/calendar/DaySheet';
import { EventChip } from '@/features/calendar/EventChip';
import { PeriodHeader } from '@/features/calendar/PeriodHeader';
import { useDayThemeId } from '@/features/calendar/useDayTheme';
import { RoutedEventSheet } from '@/features/event-sheet/RoutedEventSheet';
import { useElementHeight } from '@/hooks/useElementHeight';
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';
import { useOccurrences } from '@/hooks/useOccurrences';
import { formatDayLong, formatMonth, weekdayShort } from '@/lib/format';
import { strings } from '@/strings';
import { ThemeScope } from '@/ui';
import styles from './MonthView.module.css';

const MAX_LANES = 3;
const MAX_DOTS = 3;
/** Ribbon grid sizes in px; keep in sync with `.ribbons` in MonthView.module.css. */
const NUMERAL_ROW = 28;
const LANE_HEIGHT = 22;
const LANE_GAP = 3;

/**
 * How many ribbon lanes fit under the numeral row of a `height`px week row (at most MAX_LANES).
 * The row height follows the viewport; unmeasured (`null`) means MAX_LANES.
 */
function ribbonLanes(height: number | null): number {
  if (height === null) return MAX_LANES;
  const fit = Math.floor((height - NUMERAL_ROW) / (LANE_GAP + LANE_HEIGHT));
  return Math.max(1, Math.min(MAX_LANES, fit));
}

/** `/:versionId/month/:month`: day grid tinted by each day's dominant event. */
export function MonthView() {
  const { version, catalog, region, userTimeZone, viewDate, weekStartsOn, hiddenCategories } =
    useVersionView();
  const params = useParams();
  const month = params.month ?? monthOf(viewDate);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [selected, setSelected] = useState<LocalDate | null>(null);

  const weeks = useMemo(() => monthWeeks(month, weekStartsOn), [month, weekStartsOn]);
  const allDays = useMemo(() => weeks.flat(), [weeks]);
  const first = allDays[0] ?? viewDate;
  const last = allDays[allDays.length - 1] ?? viewDate;
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
    () => occurrencesByDay(occurrences, allDays, userTimeZone, catalog),
    [occurrences, allDays, userTimeZone, catalog],
  );

  return (
    <div className={styles.view}>
      <PeriodHeader
        title={formatMonth(month)}
        prevLabel={strings.calendar.previousMonth}
        nextLabel={strings.calendar.nextMonth}
        currentLabel={strings.calendar.thisMonth}
      />

      <div className={styles.calendar}>
        <div className={styles.weekdays} aria-hidden="true">
          {(weeks[0] ?? []).map((d) => (
            <span key={d}>{weekdayShort(d)}</span>
          ))}
        </div>
        {weeks.map((week) => (
          <WeekRow
            key={week[0]}
            week={week}
            month={month}
            occurrences={occurrences}
            byDay={byDay}
            isDesktop={isDesktop}
            onSelect={setSelected}
          />
        ))}
      </div>

      {selected && (
        <DaySheet
          date={selected}
          occurrences={byDay.get(selected) ?? []}
          onClose={() => setSelected(null)}
        />
      )}
      <RoutedEventSheet />
    </div>
  );
}

function WeekRow({
  week,
  month,
  occurrences,
  byDay,
  isDesktop,
  onSelect,
}: {
  week: LocalDate[];
  month: string;
  occurrences: Occurrence[];
  byDay: Map<LocalDate, Occurrence[]>;
  isDesktop: boolean;
  onSelect: (date: LocalDate) => void;
}) {
  const { catalog, userTimeZone, today } = useVersionView();
  const themeFor = useDayThemeId();
  const [ribbonsRef, ribbonsHeight] = useElementHeight<HTMLDivElement>();
  const ribbons = isDesktop ? layoutRibbons(occurrences, week, userTimeZone, catalog) : [];
  const lanes = ribbonLanes(ribbonsHeight);
  const hiddenPerDay = week.map(
    (_, col) =>
      ribbons.filter((s) => s.lane >= lanes && s.startCol <= col && s.endCol >= col).length,
  );

  return (
    <div className={styles.week}>
      {week.map((date, col) => {
        const events = byDay.get(date) ?? [];
        const names = events
          .map((o) => catalog[o.eventId]?.name)
          .filter(Boolean)
          .join(', ');
        return (
          <ThemeScope
            key={date}
            themeId={themeFor(events)}
            className={styles.cell}
            style={{ gridColumn: col + 1 }}
            data-date={date}
            data-outside={date.slice(0, 7) !== month || undefined}
            data-today={date === today || undefined}
            data-has-events={events.length > 0 || undefined}
          >
            <button
              type="button"
              className={styles.cellButton}
              onClick={() => onSelect(date)}
              aria-label={strings.calendar.dayLabel(formatDayLong(date), names)}
              aria-current={date === today ? 'date' : undefined}
            >
              <span className={styles.numeral}>{Number(date.slice(8))}</span>
              {!isDesktop && events.length > 0 && (
                <span className={styles.dots}>
                  {events.slice(0, MAX_DOTS).map((o) => (
                    <ThemeScope
                      as="span"
                      key={o.key}
                      themeId={catalog[o.eventId]?.themeId ?? 'base'}
                      className={styles.dot}
                      data-unverified={!o.verified || undefined}
                    />
                  ))}
                </span>
              )}
            </button>
          </ThemeScope>
        );
      })}

      {isDesktop && (
        <div ref={ribbonsRef} className={styles.ribbons}>
          {ribbons
            .filter((s) => s.lane < lanes)
            .map((seg) => (
              <EventChip
                key={seg.occurrence.key}
                occurrence={seg.occurrence}
                date={week[seg.startCol] ?? month}
                variant="ribbon"
                continuesBefore={seg.continuesBefore}
                continuesAfter={seg.continuesAfter}
                className={styles.ribbon}
                style={{
                  gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                  gridRow: seg.lane + 2,
                }}
              />
            ))}
          {week.map(
            (date, col) =>
              (hiddenPerDay[col] ?? 0) > 0 && (
                <button
                  key={date}
                  type="button"
                  className={styles.more}
                  style={{ gridColumn: col + 1, gridRow: 1 }}
                  onClick={() => onSelect(date)}
                >
                  {strings.calendar.moreEvents(hiddenPerDay[col] ?? 0)}
                </button>
              ),
          )}
        </div>
      )}
    </div>
  );
}
