import type { ChecklistItem, EventDefinition, VersionId } from '@/domain/types';

/** "Master Angler" → "master-angler" (stable ids for saved progress). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * What a player can tick off for an event in a version: its sourced quests (from `experience`),
 * then any extra `checklist` items (achievements, tasks). Empty when the data has none.
 */
export function checklistItems(def: EventDefinition, versionId: VersionId): ChecklistItem[] {
  const experience = def.experience?.[versionId];
  const quests: ChecklistItem[] = (experience?.quests ?? []).map((q) => ({
    id: `quest-${slugify(q.name)}`,
    kind: 'quest',
    name: q.name,
    source: experience?.source,
  }));
  return [...quests, ...(def.checklist?.[versionId] ?? [])];
}

/** Done / total for the items that still exist (ids dropped from the data don't count). */
export function checklistProgress(
  items: ChecklistItem[],
  done: readonly string[],
): { done: number; total: number } {
  const ids = new Set(done);
  return { done: items.filter((i) => ids.has(i.id)).length, total: items.length };
}
