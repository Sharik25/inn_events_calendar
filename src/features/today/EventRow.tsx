import { useId } from 'react';
import { Link } from 'react-router';
import type { EventDefinition, Occurrence } from '@/domain/types';
import { ChecklistProgress } from '@/features/checklist/ChecklistProgress';
import { useTheme } from '@/hooks/useTheme';
import { uniqueSvgIds } from '@/themes/art/helpers';
import { Icon, ThemeScope } from '@/ui';
import styles from './EventRow.module.css';

/**
 * Compact sidebar row for another event of the day: the event's emblem in a small medallion and
 * its (short) name, linking to its details (the whole row is the tap target), dressed in the event's own
 * theme accent. Shows checklist progress when the event has a checklist.
 */
export function EventRow({
  def,
  occurrence,
  href,
}: {
  def: EventDefinition;
  occurrence: Occurrence;
  href: { search: string };
}) {
  const theme = useTheme(def.themeId);
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <ThemeScope as="article" themeId={def.themeId} className={styles.row}>
      <span className={styles.medallion} aria-hidden="true">
        {theme.emblem ? (
          <span
            className={styles.emblem}
            // Static, bundled art from theme files (never user input).
            dangerouslySetInnerHTML={{ __html: uniqueSvgIds(theme.emblem, instance) }}
          />
        ) : (
          <Icon name="flame" size={16} />
        )}
      </span>
      {/* Short name like the "Coming soon" chips (the sidebar is narrow); full name for AT. */}
      <Link to={href} className={styles.link} aria-label={def.name} title={def.name}>
        {def.shortName ?? def.name}
      </Link>
      <ChecklistProgress def={def} occurrence={occurrence} className={styles.progress} />
    </ThemeScope>
  );
}
