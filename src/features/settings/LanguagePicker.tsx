import { useId } from 'react';
import { useLanguage, useSettings } from '@/state/settings';
import { isLanguage, LANGUAGES, languageName, strings } from '@/strings';
import { reopenSettingsAfterRemount } from './reopen';
import styles from './LanguagePicker.module.css';

/** UI language, saved on this device. Defaults to the browser's language (English otherwise). */
export function LanguagePicker() {
  const id = useId();
  const language = useLanguage();
  const setLanguage = useSettings((s) => s.setLanguage);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {strings.settings.language}
      </label>
      <select
        id={id}
        className={styles.select}
        value={language}
        onChange={(e) => {
          const next = e.currentTarget.value;
          if (!isLanguage(next) || next === language) return;
          reopenSettingsAfterRemount();
          setLanguage(next);
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l} lang={l}>
            {languageName(l)}
          </option>
        ))}
      </select>
    </div>
  );
}
