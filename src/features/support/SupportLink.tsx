import { SUPPORT_URL } from '@/config';
import { strings } from '@/strings/en';
import styles from './SupportLink.module.css';

/**
 * Small "Buy me a beer" tip-jar link to an external page. No tracking: a plain link, opened in a
 * new tab without a referrer. Renders nothing until an https URL is configured.
 */
export function SupportLink({ url = SUPPORT_URL }: { url?: string }) {
  if (!url.startsWith('https://')) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.link}>
      {strings.support.beer}
      <span className={styles.srOnly}> {strings.eventSheet.opensInNewTab}</span>
    </a>
  );
}
