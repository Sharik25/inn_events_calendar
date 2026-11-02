import { useId, useState } from 'react';
import type { Region, VersionConfig } from '@/domain/types';
import { strings } from '@/strings';
import { Icon } from '@/ui';
import { feedUrls } from './feedUrls';
import styles from './SubscribeSection.module.css';

export function SubscribeSection({ version, region }: { version: VersionConfig; region: Region }) {
  const [copied, setCopied] = useState(false);
  const fieldId = useId();
  if (version.events.length === 0) return null;

  const urls = feedUrls(version, region);
  const secure = window.location.protocol === 'https:';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(urls.https);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); the field stays selectable.
    }
  };

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        {strings.calendarExport.subscribeHint(version.shortName, region.label)}
      </p>

      <div className={styles.labelGroup}>
        <label className={styles.label} htmlFor={fieldId}>
          {strings.calendarExport.feedUrl}
        </label>
        <span className={styles.field}>
          <input
            id={fieldId}
            className={styles.input}
            readOnly
            value={urls.https}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button type="button" className={styles.copy} onClick={copy}>
            {copied ? strings.calendarExport.copied : strings.calendarExport.copy}
          </button>
        </span>
      </div>

      {secure ? (
        <div className={styles.buttons}>
          <a className={styles.button} href={urls.webcal}>
            <Icon name="calendarPlus" size={18} />
            {strings.calendarExport.openApple}
          </a>
          <a className={styles.button} href={urls.google} target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={18} />
            {strings.calendarExport.openGoogle}
          </a>
        </div>
      ) : (
        <p className={styles.note}>{strings.calendarExport.needsHttps}</p>
      )}
      <p className={styles.note}>{strings.calendarExport.outlookHow}</p>
      <a className={styles.download} href={urls.path} download>
        {strings.calendarExport.downloadFeed}
      </a>
    </div>
  );
}
