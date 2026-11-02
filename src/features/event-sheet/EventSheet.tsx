import { useMemo } from 'react';
import { useVersionView } from '@/app/versionView';
import { findOccurrenceForDay } from '@/engine/agenda';
import { expandOccurrences } from '@/engine/expand';
import { addDays, daysRange } from '@/engine/time';
import { Countdown } from '@/features/common/Countdown';
import { UnconfirmedMarker } from '@/features/common/UnconfirmedMarker';
import { strings } from '@/strings';
import { Badge, Icon, Sheet, ThemeScope } from '@/ui';
import { ChecklistSection } from '@/features/checklist/ChecklistSection';
import { ExperienceSection } from './ExperienceSection';
import styles from './EventSheet.module.css';

/** Event details for `?event=<id>`, styled with that event's theme. `date` picks the occurrence. */
export function EventSheet({
  eventId,
  date,
  onClose,
}: {
  eventId: string | null;
  date?: string;
  onClose: () => void;
}) {
  const { version, catalog, region, userTimeZone, viewDate: currentDate, now } = useVersionView();
  const viewDate = date ?? currentDate;
  const def = eventId ? catalog[eventId] : undefined;

  const occurrence = useMemo(() => {
    if (!def) return null;
    const range = daysRange(addDays(viewDate, -400), addDays(viewDate, 400), userTimeZone);
    return findOccurrenceForDay(
      expandOccurrences(version, region.id, range),
      def.id,
      viewDate,
      userTimeZone,
    );
  }, [def, version, region.id, viewDate, userTimeZone]);

  if (!def) return null;
  const binding = version.events.find((b) => b.eventId === def.id);
  const experience = def.experience?.[version.id];
  const notes = [binding?.notes, occurrence?.note].filter(Boolean);
  const links = [
    ...(def.links ?? []),
    ...(occurrence?.source
      ? [{ label: strings.eventSheet.dateSource, url: occurrence.source }]
      : []),
  ];

  return (
    <ThemeScope themeId={def.themeId} style={{ display: 'contents' }}>
      <Sheet open onClose={onClose} title={def.name}>
        <div className={styles.badges}>
          <Badge>{strings.categories[def.category]}</Badge>
          {occurrence && !occurrence.verified && <UnconfirmedMarker />}
        </div>

        {occurrence ? (
          <>
            <p className={styles.countdown}>
              <Countdown occurrence={occurrence} now={now} timeZone={userTimeZone} />
            </p>
            {occurrence.location && (
              <dl className={styles.times}>
                <dt>{strings.eventSheet.location}</dt>
                <dd>{occurrence.location}</dd>
              </dl>
            )}
          </>
        ) : (
          <p>{strings.eventSheet.notFound}</p>
        )}

        <p className={styles.summary}>{def.summary}</p>

        {def.highlights && def.highlights.length > 0 && (
          <section>
            <h3 className={styles.heading}>{strings.eventSheet.highlights}</h3>
            <ul className={styles.highlights}>
              {def.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        )}

        {experience && <ExperienceSection experience={experience} />}

        {occurrence && <ChecklistSection def={def} occurrence={occurrence} />}

        {notes.length > 0 && (
          <section>
            <h3 className={styles.heading}>{strings.eventSheet.notes}</h3>
            {notes.map((n) => (
              <p key={n} className={styles.note}>
                {n}
              </p>
            ))}
          </section>
        )}

        {links.length > 0 && (
          <section>
            <h3 className={styles.heading}>{strings.eventSheet.links}</h3>
            <ul className={styles.links}>
              {links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    {l.label}
                    <Icon name="external" size={16} />
                    <span className={styles.srOnly}>{strings.eventSheet.opensInNewTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Sheet>
    </ThemeScope>
  );
}
