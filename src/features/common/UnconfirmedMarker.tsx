import type { Occurrence } from '@/domain/types';
import { Badge, cx, Icon, Tooltip } from '@/ui';
import { dateStatusHint, dateStatusLabel } from './dateStatus';
import styles from './UnconfirmedMarker.module.css';

/**
 * "Unconfirmed" or "Estimated" badge + info tip, shown wherever a date that isn't confirmed is
 * displayed. Renders nothing for a confirmed date.
 */
export function UnconfirmedMarker({
  occurrence,
  onDark = false,
}: {
  occurrence: Pick<Occurrence, 'verified' | 'estimated'>;
  onDark?: boolean;
}) {
  const label = dateStatusLabel(occurrence);
  if (!label) return null;
  return (
    <span className={cx(styles.marker, onDark && styles.onDark)}>
      <Badge tone="unconfirmed" className={styles.badge}>
        {label}
      </Badge>
      <Tooltip content={dateStatusHint(occurrence)}>
        <button type="button" className={styles.info} aria-label={label}>
          <Icon name="info" size={20} />
        </button>
      </Tooltip>
    </span>
  );
}
