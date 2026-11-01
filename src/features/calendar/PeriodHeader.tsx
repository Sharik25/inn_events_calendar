import { Link } from 'react-router';
import { useVersionView } from '@/app/versionView';
import { Icon } from '@/ui';
import styles from './PeriodHeader.module.css';

/** "‹ October 2026 ›" header for Week/Month, with a jump back to the current period. */
export function PeriodHeader({
  title,
  prevLabel,
  nextLabel,
  currentLabel,
}: {
  title: string;
  prevLabel: string;
  nextLabel: string;
  currentLabel: string;
}) {
  const { nav } = useVersionView();
  return (
    <header className={styles.header}>
      <Link to={nav.prev} className={`${styles.arrow} ${styles.prev}`} aria-label={prevLabel}>
        <Icon name="chevronLeft" />
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <Link to={nav.next} className={`${styles.arrow} ${styles.next}`} aria-label={nextLabel}>
        <Icon name="chevronRight" />
      </Link>
      {!nav.isCurrent && (
        <Link to={nav.current} className={styles.current}>
          <Icon name="today" size={18} />
          {currentLabel}
        </Link>
      )}
    </header>
  );
}
