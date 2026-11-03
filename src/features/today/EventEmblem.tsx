import { useId } from 'react';
import type { ThemeId } from '@/domain/types';
import { useTheme } from '@/hooks/useTheme';
import { uniqueSvgIds } from '@/themes/art/helpers';
import { cx, Icon } from '@/ui';
import styles from './EventEmblem.module.css';

/** An event's emblem (its theme's small art) in a round medallion; a flame when it has none. */
export function EventEmblem({ themeId, className }: { themeId: ThemeId; className?: string }) {
  const theme = useTheme(themeId);
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <span className={cx(styles.medallion, className)} aria-hidden="true">
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
  );
}
