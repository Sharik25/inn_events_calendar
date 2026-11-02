import { create } from 'zustand';

/**
 * Holiday checklist progress, saved on this device. Keyed by occurrence (`Occurrence.key`), so a
 * yearly holiday or the weekly contest starts fresh each time it comes around.
 *
 * Stored as a versioned envelope so the shape can grow (e.g. notes, timestamps) with a migration;
 * every storage access is guarded: private mode, full storage or disabled storage just means
 * progress lives for this session only.
 */
export const CHECKLIST_STORAGE_KEY = 'almanac-checklist';

interface StoredChecklist {
  version: 1;
  /** Occurrence key → ids of the items ticked off. */
  done: Record<string, string[]>;
}

function load(): StoredChecklist['done'] {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<StoredChecklist>;
    if (parsed.version !== 1 || !parsed.done || typeof parsed.done !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed.done).filter(
        ([, ids]) => Array.isArray(ids) && ids.every((id) => typeof id === 'string'),
      ),
    );
  } catch {
    return {};
  }
}

function save(done: StoredChecklist['done']) {
  try {
    const data: StoredChecklist = { version: 1, done };
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: keep progress in memory for this session.
  }
}

interface ChecklistStore {
  done: StoredChecklist['done'];
  toggle(occurrenceKey: string, itemId: string, on: boolean): void;
  /** Re-reads storage (tests, other tabs). */
  reload(): void;
}

export const useChecklist = create<ChecklistStore>()((set, get) => ({
  done: load(),
  toggle(occurrenceKey, itemId, on) {
    const current = get().done[occurrenceKey] ?? [];
    const next = on ? [...new Set([...current, itemId])] : current.filter((id) => id !== itemId);
    const { [occurrenceKey]: _old, ...rest } = get().done;
    const done = next.length ? { ...rest, [occurrenceKey]: next } : rest;
    set({ done });
    save(done);
  },
  reload: () => set({ done: load() }),
}));

const NONE: readonly string[] = [];

/** Ids ticked off for one occurrence. */
export function useChecklistDone(occurrenceKey: string | undefined): readonly string[] {
  return useChecklist((s) => (occurrenceKey ? (s.done[occurrenceKey] ?? NONE) : NONE));
}
