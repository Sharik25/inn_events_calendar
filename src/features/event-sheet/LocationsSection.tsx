import type { EventDefinition, EventLocations } from '@/domain/types';
import { strings } from '@/strings';
import { Icon } from '@/ui';
import styles from './EventSheet.module.css';

/** "Where": the event's places for the Alliance, the Horde and everyone, with their source. */
export function LocationsSection({
  locations,
  links,
}: {
  locations: EventLocations;
  links: EventDefinition['links'];
}) {
  const { what, alliance, horde, everyone, source } = locations;
  const rows = [
    [strings.eventSheet.alliance, alliance],
    [strings.eventSheet.horde, horde],
    [strings.eventSheet.everyone, everyone],
  ] as const;
  // The source is often the same page as "Learn more"; don't list it twice.
  const showSource = !links?.some((l) => l.url === source);
  return (
    <section>
      <h3 className={styles.heading}>{strings.eventSheet.where}</h3>
      {what && <p className={styles.whereWhat}>{what}</p>}
      <dl className={styles.facts}>
        {rows.map(
          ([label, places]) =>
            places && (
              <div key={label} className={styles.factRow}>
                <dt>{label}</dt>
                <dd>{places.join(', ')}</dd>
              </div>
            ),
        )}
      </dl>
      <p className={styles.note}>{strings.eventSheet.locationsNote}</p>
      {showSource && (
        <a href={source} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {strings.eventSheet.locationsSource}
          <Icon name="external" size={16} />
          <span className={styles.srOnly}>{strings.eventSheet.opensInNewTab}</span>
        </a>
      )}
    </section>
  );
}
