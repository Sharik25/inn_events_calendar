import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router';
import { withEvent } from '@/app/paths';
import { useVersionView } from '@/app/versionView';
import type { Occurrence } from '@/domain/types';
import { isShortEvent } from '@/engine/calendar';
import type { LocalDate } from '@/engine/time';
import { formatTime } from '@/lib/format';
import { cx, ThemeScope } from '@/ui';
import styles from './EventChip.module.css';
import { dateStatusLabel } from '@/features/common/dateStatus';

/**
 * An event as a chip (mobile lists) or ribbon (desktop grids), tinted by the event's theme.
 * Opens the event sheet for `date`. Unconfirmed dates get a dashed border and hidden text.
 */
export function EventChip({
  occurrence,
  date,
  variant = 'chip',
  continuesBefore = false,
  continuesAfter = false,
  className,
  style,
}: {
  occurrence: Occurrence;
  date: LocalDate;
  variant?: 'chip' | 'ribbon' | 'block';
  continuesBefore?: boolean;
  continuesAfter?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { catalog, displayTimeZone } = useVersionView();
  const location = useLocation();
  const def = catalog[occurrence.eventId];
  if (!def) return null;
  const time = isShortEvent(occurrence) ? formatTime(occurrence.start, displayTimeZone) : null;

  return (
    <ThemeScope themeId={def.themeId} className={cx(styles.wrap, className)} style={style}>
      <Link
        to={{ search: withEvent(location.search, def.id, date) }}
        className={cx(styles[variant], !occurrence.verified && styles.unverified)}
        data-category={def.category}
        data-continues-before={continuesBefore || undefined}
        data-continues-after={continuesAfter || undefined}
        title={def.name}
      >
        {time && <span className={styles.time}>{time}</span>}
        <span className={styles.name}>
          {variant === 'block' ? def.name : (def.shortName ?? def.name)}
        </span>
        {!occurrence.verified && (
          <span className={styles.srOnly}>({dateStatusLabel(occurrence)})</span>
        )}
      </Link>
    </ThemeScope>
  );
}
