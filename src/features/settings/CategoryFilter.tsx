import type { EventCatalog, EventCategory, VersionConfig } from '@/domain/types';
import { useSettings } from '@/state/settings';
import { strings } from '@/strings';
import styles from './CategoryFilter.module.css';

/** Toggle which kinds of events appear (holidays, faire, fishing, …) for the current version. */
export function CategoryFilter({
  version,
  catalog,
}: {
  version: VersionConfig;
  catalog: EventCatalog;
}) {
  const hidden = useSettings((s) => s.hiddenCategories);
  const setHidden = useSettings((s) => s.setHiddenCategories);
  const categories = [
    ...new Set(version.events.flatMap((b) => catalog[b.eventId]?.category ?? [])),
  ] as EventCategory[];
  if (categories.length === 0) return null;

  const toggle = (category: EventCategory, shown: boolean) =>
    setHidden(shown ? hidden.filter((c) => c !== category) : [...hidden, category]);

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{strings.settings.eventsShown}</legend>
      <p className={styles.hint}>{strings.settings.eventsShownHint}</p>
      <div className={styles.options}>
        {categories.map((category) => (
          <label key={category} className={styles.option}>
            <input
              type="checkbox"
              className={styles.input}
              checked={!hidden.includes(category)}
              onChange={(e) => toggle(category, e.currentTarget.checked)}
            />
            <span className={styles.label}>{strings.categories[category]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
