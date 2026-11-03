import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { paths, withEvent } from '@/app/paths';
import { useVersionView } from '@/app/versionView';
import { buildDayAgenda } from '@/engine/agenda';
import { addDays, dayRange } from '@/engine/time';
import { ChecklistProgress } from '@/features/checklist/ChecklistProgress';
import { Countdown } from '@/features/common/Countdown';
import { LaunchCountdown } from '@/features/version-switcher/LaunchCountdown';
import { UnconfirmedMarker } from '@/features/common/UnconfirmedMarker';
import { RoutedEventSheet } from '@/features/event-sheet/RoutedEventSheet';
import { useOccurrences } from '@/hooks/useOccurrences';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatDistance, formatRange } from '@/lib/format';
import { strings } from '@/strings';
import { AmbientParticles, Fireplace, Icon, ParchmentCard } from '@/ui';
import { AddToCalendar } from '@/features/calendar-export/AddToCalendar';
import { DateNumeral } from './DateNumeral';
import { EventCard } from './EventCard';
import styles from './TodayView.module.css';

const COMING_SOON_DAYS = 30;

/** Today (`/:versionId/today`) and any day (`/:versionId/day/:date`). */
export function TodayView() {
  const view = useVersionView();
  const { version, catalog, region, userTimeZone, displayTimeZone, now, today, viewDate, isToday } =
    view;
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  const occurrences = useOccurrences(
    version,
    region.id,
    viewDate,
    addDays(viewDate, COMING_SOON_DAYS + 1),
    userTimeZone,
    catalog,
    view.hiddenCategories,
  );
  const agenda = useMemo(
    () => buildDayAgenda(occurrences, viewDate, userTimeZone, catalog, COMING_SOON_DAYS),
    [occurrences, viewDate, userTimeZone, catalog],
  );

  const dayHref = (date: string) =>
    date === today ? paths.today(version.id) : paths.day(version.id, date);
  const eventHref = (eventId: string) => ({ search: withEvent(location.search, eventId) });
  const { dominant } = agenda;
  const dominantDef = dominant ? catalog[dominant.eventId] : undefined;
  const also = agenda.active.slice(1);
  // "Coming soon" distances count from now on Today, from the start of the viewed day otherwise.
  const soonFrom = isToday ? now.getTime() : dayRange(viewDate, userTimeZone).start.getTime();

  return (
    <div className={styles.layout}>
      {/* First in the page: under the version chip (left column on desktop, top on phones), the
          launch countdown of an upcoming version, then "Coming soon". */}
      <div className={styles.soon}>
        <LaunchCountdown view={view} variant="sidebar" />
        <section aria-labelledby="soon-title">
          <h2 id="soon-title" className={styles.sectionTitle}>
            {strings.today.comingSoon}
          </h2>
          {agenda.comingSoon.length > 0 ? (
            <ul className={styles.chips}>
              {agenda.comingSoon.map((o) => {
                const def = catalog[o.eventId];
                return (
                  def && (
                    <li key={o.key}>
                      <Link to={eventHref(o.eventId)} className={styles.chip}>
                        <span className={styles.chipName}>{def.shortName ?? def.name}</span>{' '}
                        <time dateTime={o.start.toISOString()} className={styles.chipWhen}>
                          {strings.today.inDistance(formatDistance(o.start.getTime() - soonFrom))}
                        </time>
                      </Link>
                    </li>
                  )
                );
              })}
            </ul>
          ) : (
            <p className={styles.empty}>{strings.today.comingSoonEmpty}</p>
          )}
        </section>
      </div>
      <section className={styles.hero} aria-labelledby="day-title">
        <div className={styles.dayNav}>
          <Link
            to={dayHref(addDays(viewDate, -1))}
            className={styles.navArrow}
            aria-label={strings.today.previousDay}
          >
            <Icon name="chevronLeft" />
          </Link>
          <DateNumeral date={viewDate} />
          <Link
            to={dayHref(addDays(viewDate, 1))}
            className={styles.navArrow}
            aria-label={strings.today.nextDay}
          >
            <Icon name="chevronRight" />
          </Link>
        </div>

        {!isToday && (
          <Link to={paths.today(version.id)} className={styles.todayLink}>
            <Icon name="today" size={18} />
            {strings.today.backToToday}
          </Link>
        )}

        {dominant && dominantDef ? (
          <>
            <h1 id="day-title" className={styles.title}>
              {dominantDef.name}
            </h1>
            <p className={styles.timing}>
              {isToday && (
                <Countdown
                  occurrence={dominant}
                  now={now}
                  timeZone={displayTimeZone}
                  className={styles.countdown}
                />
              )}
              <UnconfirmedMarker occurrence={dominant} onDark />
              <ChecklistProgress def={dominantDef} occurrence={dominant} />
            </p>
            <p className={styles.range}>
              <time dateTime={dominant.start.toISOString()}>
                {formatRange(dominant.start, dominant.end, displayTimeZone)}
              </time>
            </p>
            <ParchmentCard className={styles.heroCard}>
              <p className={styles.summary}>{dominantDef.summary}</p>
              {dominantDef.highlights && (
                // role="list": Safari drops list semantics once the bullets are gone.
                // eslint-disable-next-line jsx-a11y/no-redundant-roles
                <ul className={styles.highlights} role="list">
                  {dominantDef.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              <div className={styles.actions}>
                <Link
                  to={eventHref(dominantDef.id)}
                  className={styles.detailsButton}
                  aria-label={strings.today.detailsFor(dominantDef.name)}
                >
                  {strings.today.details}
                </Link>
                <AddToCalendar occurrence={dominant} />
              </div>
            </ParchmentCard>
          </>
        ) : (
          <>
            <h1 id="day-title" className={styles.title}>
              {strings.today.quietDay}
            </h1>
            <Fireplace reducedMotion={reducedMotion} className={styles.hearth} />
            <AmbientParticles kind="sparks" placement="sides" count={14} still={reducedMotion} />
            <AmbientParticles kind="splinters" placement="sides" count={6} still={reducedMotion} />
          </>
        )}
      </section>

      {also.length > 0 && (
        <div className={styles.side}>
          <section aria-labelledby="also-title">
            <h2 id="also-title" className={styles.sectionTitle}>
              {strings.today.alsoToday}
            </h2>
            <ul className={styles.cards}>
              {also.map((o) => (
                <li key={o.key}>
                  <EventCard occurrence={o} href={eventHref(o.eventId)} view={view} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <RoutedEventSheet />
    </div>
  );
}
