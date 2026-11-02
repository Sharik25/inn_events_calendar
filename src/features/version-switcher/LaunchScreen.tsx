import { Link, useLocation } from 'react-router';
import type { VersionView } from '@/app/versionView';
import type { VersionConfig } from '@/domain/types';
import { launchInstant, switchVersionPath } from '@/engine/version';
import { useTheme } from '@/hooks/useTheme';
import { formatDateTime, formatDuration } from '@/lib/format';
import { strings } from '@/strings';
import { uniqueSvgIds } from '@/themes/art/helpers';
import { Frame, ParchmentCard } from '@/ui';
import styles from './LaunchScreen.module.css';

/** Shown for an upcoming version in every view until it launches (PLAN.md Phase 7). */
export function LaunchScreen({
  view: { version, region, now, userTimeZone },
  fallback,
}: {
  view: VersionView;
  /** A live version to offer as the way back (same view and date). */
  fallback: VersionConfig | undefined;
}) {
  const location = useLocation();
  const theme = useTheme(version.baseThemeId);
  const launch = launchInstant(version);

  return (
    <section className={styles.screen} aria-labelledby="launch-title">
      {theme.emblem && (
        <Frame className={styles.emblemFrame} aria-hidden="true">
          <span
            className={styles.emblem}
            // Static, bundled art from theme files (never user input).
            dangerouslySetInnerHTML={{ __html: uniqueSvgIds(theme.emblem, 'launch') }}
          />
        </Frame>
      )}
      <p className={styles.eyebrow}>{strings.versions.comingSoon}</p>
      <h1 id="launch-title" className={styles.title}>
        {version.name}
      </h1>
      {launch && (
        <>
          <p className={styles.countdown}>
            {strings.versions.launchesIn(formatDuration(launch.getTime() - now.getTime()))}
          </p>
          <p className={styles.when}>
            <time dateTime={launch.toISOString()}>
              {strings.versions.launchTime(formatDateTime(launch, userTimeZone))}
            </time>
            <br />
            {strings.versions.serverLaunch(formatDateTime(launch, region.timeZone), region.label)}
          </p>
        </>
      )}
      {version.summary && (
        <ParchmentCard className={styles.card}>
          <p className={styles.summary}>{version.summary}</p>
        </ParchmentCard>
      )}
      {fallback && (
        <Link
          to={switchVersionPath(location.pathname, version.id, fallback.id)}
          className={styles.back}
        >
          {strings.versions.backTo(fallback.shortName)}
        </Link>
      )}
    </section>
  );
}
