import { useId } from 'react';
import type { EventDefinition, Occurrence } from '@/domain/types';
import { checklistItems, checklistProgress } from '@/engine/checklist';
import { useChecklist, useChecklistDone } from '@/state/checklist';
import { strings } from '@/strings';
import { Checkbox } from '@/ui';
import styles from './Checklist.module.css';

/** Tick off an occurrence's quests and achievements; saved on this device. */
export function ChecklistSection({
  def,
  occurrence,
}: {
  def: EventDefinition;
  occurrence: Occurrence;
}) {
  const headingId = useId();
  const done = useChecklistDone(occurrence.key);
  const toggle = useChecklist((s) => s.toggle);
  const items = checklistItems(def, occurrence.versionId);
  if (items.length === 0) return null;
  const p = checklistProgress(items, done);

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.heading}>
        {strings.checklist.title}
        <span className={styles.count}>{strings.checklist.progressLabel(p.done, p.total)}</span>
      </h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <label className={styles.row}>
              <Checkbox
                checked={done.includes(item.id)}
                onChange={(e) => toggle(occurrence.key, item.id, e.currentTarget.checked)}
              />
              <span className={styles.text}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.kind}>{strings.checklist.kinds[item.kind]}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className={styles.hint}>{strings.checklist.hint}</p>
    </section>
  );
}
