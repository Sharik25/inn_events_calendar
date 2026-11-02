import { formatInTimeZone } from 'date-fns-tz';
import type { VersionConfig } from '@/domain/types';
import { findRegion } from '@/engine/expand';
import { useNow } from '@/hooks/useNow';
import { formatDate, formatTime, zoneLabel } from '@/lib/format';
import { useRegionId } from '@/state/settings';
import { strings } from '@/strings';
import styles from './ServerClock.module.css';

/** Current server time for the selected region of a version. */
export function ServerClock({ version }: { version: VersionConfig }) {
  const now = useNow();
  const region = findRegion(version, useRegionId(version));

  return (
    <p className={styles.clock}>
      <span className={styles.caption}>{strings.settings.serverTime(region.label)}</span>
      <time
        className={styles.time}
        dateTime={formatInTimeZone(now, region.timeZone, "yyyy-MM-dd'T'HH:mmXXX")}
      >
        {formatTime(now, region.timeZone)}
        <span className={styles.date}>
          {formatDate(now, region.timeZone)} · {zoneLabel(now, region.timeZone)}
        </span>
      </time>
    </p>
  );
}
