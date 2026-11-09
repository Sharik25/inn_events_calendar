import { Link } from 'react-router';
import type { EventDefinition } from '@/domain/types';
import { ThemeScope } from '@/ui';
import { EventEmblem } from './EventEmblem';
import styles from './EventRow.module.css';

/**
 * Compact sidebar row for another event of the day: the event's emblem in a small medallion and
 * its (short) name, linking to its details (the whole row is the tap target), dressed in the event's own
 * theme accent.
 */
export function EventRow({ def, href }: { def: EventDefinition; href: { search: string } }) {
  return (
    <ThemeScope as="article" themeId={def.themeId} className={styles.row}>
      <EventEmblem themeId={def.themeId} />
      {/* Short name like the "Coming soon" chips (the sidebar is narrow); full name for AT. */}
      <Link to={href} className={styles.link} aria-label={def.name} title={def.name}>
        {def.shortName ?? def.name}
      </Link>
    </ThemeScope>
  );
}
