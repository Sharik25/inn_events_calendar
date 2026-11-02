import { Link } from 'react-router';
import { strings } from '@/strings';
import { ParchmentCard, ThemeScope } from '@/ui';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <ThemeScope themeId="base" withBackground className={styles.page}>
      <ParchmentCard as="main" className={styles.card}>
        <h1 className={styles.title}>{strings.notFound.title}</h1>
        <p>{strings.notFound.text}</p>
        <Link to="/" className={styles.link}>
          {strings.notFound.home}
        </Link>
      </ParchmentCard>
    </ThemeScope>
  );
}
