import { Link } from 'react-router';
import type { EventDefinition, Occurrence } from '@/domain/types';
import { formatDate, formatDistance } from '@/lib/format';
import { strings } from '@/strings';
import { EventEmblem } from './EventEmblem';
import styles from './ComingSoonCard.module.css';

/**
 * An upcoming event in "Coming soon", linking to its details. `chip`: name and distance in a small
 * pill. `inn` (the quiet day at the inn): a little wooden card with the event's emblem, its date
 * and distance, lit by the quiet day's accent (`--quiet-accent`: Forever's blue, else the
 * theme's own).
 */
export function ComingSoonCard({
  def,
  occurrence,
  href,
  from,
  timeZone,
  variant = 'chip',
}: {
  def: EventDefinition;
  occurrence: Occurrence;
  href: { search: string };
  /** Distances count from this instant (ms). */
  from: number;
  timeZone: string;
  variant?: 'chip' | 'inn';
}) {
  const name = def.shortName ?? def.name;
  const distance = strings.today.inDistance(formatDistance(occurrence.start.getTime() - from));

  if (variant === 'chip') {
    return (
      <Link to={href} className={styles.chip}>
        <span className={styles.chipName}>{name}</span>{' '}
        <time dateTime={occurrence.start.toISOString()} className={styles.chipWhen}>
          {distance}
        </time>
      </Link>
    );
  }

  const date = formatDate(occurrence.start, timeZone);
  return (
    <Link
      to={href}
      className={styles.inn}
      title={def.name}
      // The card's lines are separate blocks; give AT one sentence with the full name.
      aria-label={`${def.name}, ${date}, ${distance}`}
    >
      <EventEmblem themeId={def.themeId} className={styles.innEmblem} />
      <span className={styles.innText}>
        <span className={styles.innName}>{name}</span>
        <span className={styles.innWhen}>
          <time dateTime={occurrence.start.toISOString()}>{date}</time>
          <span aria-hidden="true"> · </span>
          <span className={styles.innDistance}>{distance}</span>
        </span>
      </span>
    </Link>
  );
}
