import { SUPPORT_URL } from '@/config';
import { strings } from '@/strings';
import styles from './SupportLink.module.css';

/**
 * Small "Buy me a beer" tip-jar link to an external page. No tracking: a plain link, opened in a
 * new tab without a referrer. Needs an https URL; without one it renders nothing, except as an
 * inert placeholder in development and the e2e build (`preview`), so the layout can be checked
 * before the URL exists.
 */
export function SupportLink({
  url = SUPPORT_URL,
  preview = import.meta.env.DEV || import.meta.env.VITE_SUPPORT_PREVIEW === '1',
}: {
  url?: string;
  preview?: boolean;
}) {
  if (url.startsWith('https://')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.link}>
        {strings.support.beer}
        <span className={styles.srOnly}> {strings.eventSheet.opensInNewTab}</span>
      </a>
    );
  }
  if (!preview) return null;
  return (
    <a
      href="#support"
      className={styles.link}
      data-placeholder
      title={strings.support.notConfigured}
      onClick={(e) => e.preventDefault()}
    >
      {strings.support.beer}
    </a>
  );
}
