import type { EventDefinition, Occurrence } from '@/domain/types';
import { checklistItems, checklistProgress } from '@/engine/checklist';
import { useChecklistDone } from '@/state/checklist';
import { strings } from '@/strings/en';
import { cx } from '@/ui';
import styles from './Checklist.module.css';

/** "1/3" pill for an occurrence's checklist; nothing when the event has no checklist data. */
export function ChecklistProgress({
  def,
  occurrence,
  className,
}: {
  def: EventDefinition;
  occurrence: Occurrence;
  className?: string;
}) {
  const done = useChecklistDone(occurrence.key);
  const items = checklistItems(def, occurrence.versionId);
  if (items.length === 0) return null;
  const p = checklistProgress(items, done);
  return (
    <span
      className={cx(styles.progress, p.done === p.total && styles.complete, className)}
      aria-label={strings.checklist.progressLabel(p.done, p.total)}
      title={strings.checklist.progressLabel(p.done, p.total)}
    >
      <span aria-hidden="true">✓ {strings.checklist.progress(p.done, p.total)}</span>
    </span>
  );
}
