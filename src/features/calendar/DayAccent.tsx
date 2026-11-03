import { useId } from 'react';
import type { ThemeId } from '@/domain/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/hooks/useTheme';
import { uniqueSvgIds } from '@/themes/art/helpers';
import styles from './DayAccent.module.css';

/**
 * The leading theme's `dayAccent` (e.g. a small launch-day firework) in the corner of a week or
 * month day cell; nothing for themes without one. The cell must be `position: relative`, and can
 * style itself with `:has([data-day-accent])`. Twinkles gently; still under reduced motion.
 */
export function DayAccent({ themeId }: { themeId: ThemeId }) {
  const theme = useTheme(themeId);
  const still = useReducedMotion();
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!theme.dayAccent) return null;
  return (
    <span
      className={styles.accent}
      data-day-accent=""
      data-still={still || undefined}
      aria-hidden="true"
      // Static, bundled art from theme files (never user input).
      dangerouslySetInnerHTML={{ __html: uniqueSvgIds(theme.dayAccent, instance) }}
    />
  );
}
