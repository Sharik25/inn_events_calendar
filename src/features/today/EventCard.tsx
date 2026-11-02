import { useId } from 'react';
import { Link } from 'react-router';
import type { VersionView } from '@/app/versionView';
import type { Occurrence } from '@/domain/types';
import { checklistItems } from '@/engine/checklist';
import { ChecklistProgress } from '@/features/checklist/ChecklistProgress';
import { Countdown } from '@/features/common/Countdown';
import { useTheme } from '@/hooks/useTheme';
import { formatRange } from '@/lib/format';
import { strings } from '@/strings/en';
import { uniqueSvgIds } from '@/themes/art/helpers';
import { Icon, ThemeScope } from '@/ui';
import styles from './EventCard.module.css';

/**
 * A secondary event of the day, dressed in that event's own theme: accent stripe and tint,
 * a medallion with the event's emblem, live countdown pill and an unconfirmed tag.
 */
export function EventCard({
  occurrence,
  href,
  view: { catalog, now, displayTimeZone, isToday },
}: {
  occurrence: Occurrence;
  href: { search: string };
  view: VersionView;
}) {
  const def = catalog[occurrence.eventId];
  const theme = useTheme(def?.themeId ?? 'base');
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!def) return null;

  return (
    <ThemeScope as="article" themeId={def.themeId} className={styles.card}>
      <span className={styles.medallion} aria-hidden="true">
        {theme.emblem ? (
          <span
            className={styles.emblem}
            // Static, bundled art from theme files (never user input).
            dangerouslySetInnerHTML={{ __html: uniqueSvgIds(theme.emblem, instance) }}
          />
        ) : (
          <Icon name="flame" size={22} />
        )}
      </span>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={href} className={styles.link}>
            {def.name}
          </Link>
        </h3>
        <p className={styles.meta}>
          <time dateTime={occurrence.start.toISOString()}>
            {formatRange(occurrence.start, occurrence.end, displayTimeZone)}
          </time>
        </p>
        {(isToday ||
          !occurrence.verified ||
          checklistItems(def, occurrence.versionId).length > 0) && (
          <p className={styles.tags}>
            <ChecklistProgress def={def} occurrence={occurrence} />
            {isToday && (
              <Countdown
                occurrence={occurrence}
                now={now}
                timeZone={displayTimeZone}
                className={styles.countdown}
              />
            )}
            {!occurrence.verified && (
              <span className={styles.unconfirmed}>{strings.common.unconfirmed}</span>
            )}
          </p>
        )}
      </div>

      <Icon name="chevronRight" className={styles.chevron} />
    </ThemeScope>
  );
}
