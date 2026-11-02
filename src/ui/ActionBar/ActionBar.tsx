import type { ReactNode } from 'react';
import { strings } from '@/strings';
import styles from './ActionBar.module.css';

/** Fixed bottom bar of action slots, styled like a classic action bar. */
export function ActionBar({
  children,
  label = strings.actionBar.label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <nav className={styles.bar} aria-label={label}>
      <div className={styles.inner}>{children}</div>
    </nav>
  );
}

/** Visual separator between slot groups. */
export function ActionBarDivider() {
  return <span className={styles.divider} aria-hidden="true" />;
}
