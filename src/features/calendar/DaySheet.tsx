import { Link } from 'react-router';
import { withEvent } from '@/app/paths';
import { useVersionView } from '@/app/versionView';
import type { Occurrence } from '@/domain/types';
import type { LocalDate } from '@/engine/time';
import { formatDayLong, formatRange } from '@/lib/format';
import { strings } from '@/strings';
import { Sheet } from '@/ui';
import styles from './DaySheet.module.css';
import { dateStatusLabel } from '@/features/common/dateStatus';

/** Events of one day, opened by tapping a month cell. */
export function DaySheet({
  date,
  occurrences,
  onClose,
}: {
  date: LocalDate;
  occurrences: Occurrence[];
  onClose: () => void;
}) {
  const { catalog, displayTimeZone, hrefFor } = useVersionView();
  const dayHref = hrefFor('day', date);

  return (
    <Sheet open onClose={onClose} title={formatDayLong(date)}>
      {occurrences.length > 0 ? (
        <ul className={styles.list}>
          {occurrences.map((o) => {
            const def = catalog[o.eventId];
            return (
              def && (
                <li key={o.key} className={styles.item}>
                  <Link to={`${dayHref}${withEvent('', def.id)}`} className={styles.name}>
                    {def.name}
                  </Link>
                  <span className={styles.meta}>
                    {formatRange(o.start, o.end, displayTimeZone)}
                    {!o.verified && <span className={styles.unverified}>{dateStatusLabel(o)}</span>}
                  </span>
                </li>
              )
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>{strings.calendar.noEvents}</p>
      )}
      <Link to={dayHref} className={styles.open}>
        {strings.calendar.openDay}
      </Link>
    </Sheet>
  );
}
