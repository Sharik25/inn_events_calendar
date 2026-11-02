import type { EventDefinition } from '@/domain/types';
import { checklistItems, checklistProgress, slugify } from '../checklist';

const def: EventDefinition = {
  id: 'fishing',
  name: 'Fishing',
  category: 'fishing',
  rarity: 'weekly',
  themeId: 'fishing',
  summary: 'Fish.',
  experience: {
    v: { quests: [{ name: 'Master Angler' }], source: 'https://example.com/q' },
  },
  checklist: {
    v: [{ id: 'catch-a-shark', kind: 'task', name: 'Catch a shark' }],
    other: [{ id: 'x', kind: 'achievement', name: 'X' }],
  },
};

describe('checklist', () => {
  it('makes stable slugs', () => {
    expect(slugify('Master Angler')).toBe('master-angler');
    expect(slugify("Hallow's End — Treats!")).toBe('hallow-s-end-treats');
  });

  it('lists sourced quests first, then the extra items of that version', () => {
    expect(checklistItems(def, 'v')).toEqual([
      {
        id: 'quest-master-angler',
        kind: 'quest',
        name: 'Master Angler',
        source: 'https://example.com/q',
      },
      { id: 'catch-a-shark', kind: 'task', name: 'Catch a shark' },
    ]);
    expect(checklistItems(def, 'other')).toEqual([{ id: 'x', kind: 'achievement', name: 'X' }]);
    expect(checklistItems(def, 'none')).toEqual([]);
  });

  it('counts progress over the items that still exist', () => {
    const items = checklistItems(def, 'v');
    expect(checklistProgress(items, [])).toEqual({ done: 0, total: 2 });
    expect(checklistProgress(items, ['catch-a-shark', 'removed-item'])).toEqual({
      done: 1,
      total: 2,
    });
  });
});
