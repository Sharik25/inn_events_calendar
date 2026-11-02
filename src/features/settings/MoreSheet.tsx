import type { EventCatalog, VersionConfig } from '@/domain/types';
import { findRegion } from '@/engine/expand';
import { SubscribeSection } from '@/features/calendar-export/SubscribeSection';
import { useRegionId } from '@/state/settings';
import { strings } from '@/strings';
import { Sheet } from '@/ui';
import { CategoryFilter } from './CategoryFilter';
import { DisplaySettings } from './DisplaySettings';
import { LanguagePicker } from './LanguagePicker';
import { RegionSwitcher } from './RegionSwitcher';
import { ServerClock } from './ServerClock';
import styles from './MoreSheet.module.css';

/** Settings & info: region, display preferences, event filters, subscription and About. */
export function MoreSheet({
  open,
  onClose,
  version,
  catalog,
}: {
  open: boolean;
  onClose: () => void;
  version: VersionConfig;
  catalog: EventCatalog;
}) {
  const region = findRegion(version, useRegionId(version));
  return (
    <Sheet open={open} onClose={onClose} title={strings.more.title}>
      <section className={styles.section}>
        <h3 className={styles.heading}>{version.name}</h3>
        <RegionSwitcher version={version} />
        <ServerClock version={version} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{strings.settings.display}</h3>
        <LanguagePicker />
        <DisplaySettings />
        <CategoryFilter version={version} catalog={catalog} />
      </section>

      {version.events.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.heading}>{strings.calendarExport.subscribe}</h3>
          <SubscribeSection version={version} region={region} />
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.heading}>{strings.more.about}</h3>
        <p className={styles.text}>{strings.more.aboutText}</p>
        <p className={styles.legal}>{strings.legal.disclaimer}</p>
      </section>
    </Sheet>
  );
}
