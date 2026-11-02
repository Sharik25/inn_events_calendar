import type { EventDefinition } from '@/domain/types';

/** The weekly raid/lockout reset. A milestone (hidden until enabled in "Events shown"). */
export const weeklyReset: EventDefinition = {
  id: 'weekly-reset',
  name: 'Weekly reset',
  shortName: 'Reset',
  category: 'milestone',
  rarity: 'weekly',
  themeId: 'base',
  summary: 'Raid lockouts and weekly quests reset for your region.',
};
