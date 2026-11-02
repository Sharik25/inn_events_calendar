import { strings } from '@/strings';
import { Badge, cx, Icon, Tooltip } from '@/ui';
import styles from './UnconfirmedMarker.module.css';

/** "Unconfirmed" badge + info tip, shown wherever an unverified date is displayed. */
export function UnconfirmedMarker({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={cx(styles.marker, onDark && styles.onDark)}>
      <Badge tone="unconfirmed" className={styles.badge}>
        {strings.common.unconfirmed}
      </Badge>
      <Tooltip content={strings.common.unconfirmedHint}>
        <button type="button" className={styles.info} aria-label={strings.common.unconfirmed}>
          <Icon name="info" size={20} />
        </button>
      </Tooltip>
    </span>
  );
}
