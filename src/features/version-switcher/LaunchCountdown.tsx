import { useId } from 'react';
import type { VersionView } from '@/app/versionView';
import { pendingLaunches, type LaunchMoment } from '@/engine/version';
import { formatDateTime, formatDuration, zoneLabel } from '@/lib/format';
import { strings } from '@/strings';
import { cx } from '@/ui';
import styles from './LaunchCountdown.module.css';

/** Launches still ahead, grouped by moment (a worldwide launch is one line for every region). */
function byMoment(launches: LaunchMoment[]): { at: Date; launches: LaunchMoment[] }[] {
  const groups = new Map<number, { at: Date; launches: LaunchMoment[] }>();
  for (const l of launches) {
    const group = groups.get(l.at.getTime()) ?? { at: l.at, launches: [] };
    group.launches.push(l);
    groups.set(l.at.getTime(), group);
  }
  return [...groups.values()];
}

/**
 * Compact launch countdown under the version switcher while the calendar stays usable: counts
 * down to the next of the version's `launches`, with each part of the world's launch time (yours,
 * and the time it was announced in). `sidebar`: a card in the Day view's left column on desktop
 * (a single row on smaller screens); `row`: always a single row (Week and Month). Each region's
 * line drops out at its own launch moment, and the block once all have passed.
 */
export function LaunchCountdown({
  view: { version, now, userTimeZone },
  variant,
}: {
  view: VersionView;
  variant: 'sidebar' | 'row';
}) {
  const titleId = useId();
  const groups = byMoment(pendingLaunches(version, now));
  const next = groups[0];
  if (!next || version.status === 'retired') return null;

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
        {strings.versions.launchesIn(formatDuration(next.at.getTime() - now.getTime()))}
      </p>
      <ul className={styles.launches}>
        {groups.map(({ at, launches }) => (
          <li key={at.getTime()} className={styles.when} data-testid="launch-line">
            <span className={styles.regions}>
              {launches.map((l) => l.launch.label).join(' · ')}
            </span>{' '}
            <time dateTime={at.toISOString()}>
              {strings.versions.launchTime(formatDateTime(at, userTimeZone))}
            </time>
            {launches.map(({ launch }) => (
              <span key={launch.id} className={styles.server}>
                {strings.versions.regionLaunch(
                  launch.label,
                  `${formatDateTime(at, launch.timeZone)} ${zoneLabel(at, launch.timeZone)}`,
                )}
              </span>
            ))}
          </li>
        ))}
      </ul>
      {version.summary && <p className={styles.summary}>{version.summary}</p>}
    </section>
  );
}
