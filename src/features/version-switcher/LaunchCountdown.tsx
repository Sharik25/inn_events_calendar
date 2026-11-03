import { useId } from 'react';
import type { VersionView } from '@/app/versionView';
import { launchInstant, versionStatus } from '@/engine/version';
import { formatDateTime, formatDuration } from '@/lib/format';
import { strings } from '@/strings';
import { cx } from '@/ui';
import styles from './LaunchCountdown.module.css';

/**
 * Compact launch countdown for an upcoming version (target: the version's `launchDate`), shown
 * under the version switcher while the calendar stays usable. `sidebar`: a card in the Day view's
 * left column on desktop (a single row on smaller screens); `row`: always a single row (Week and
 * Month). Renders nothing once the version is live.
 */
export function LaunchCountdown({
  view: { version, region, now, userTimeZone },
  variant,
}: {
  view: VersionView;
  variant: 'sidebar' | 'row';
}) {
  const titleId = useId();
  const launch = launchInstant(version);
  if (!launch || versionStatus(version, now) !== 'upcoming') return null;

  const server = strings.versions.serverLaunch(
    formatDateTime(launch, region.timeZone),
    region.label,
  );
  return (
    <section
      className={cx(styles.countdown, styles[variant])}
      aria-labelledby={titleId}
      data-testid="launch-countdown"
    >
      <h2 id={titleId} className={styles.title}>
        {version.name}
      </h2>
      <p className={styles.left}>
        {strings.versions.launchesIn(formatDuration(launch.getTime() - now.getTime()))}
      </p>
      <p className={styles.when} title={server}>
        <time dateTime={launch.toISOString()}>
          {strings.versions.launchTime(formatDateTime(launch, userTimeZone))}
        </time>
        <span className={styles.server}>{server}</span>
      </p>
      {version.summary && <p className={styles.summary}>{version.summary}</p>}
    </section>
  );
}
