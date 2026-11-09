import type { EventDefinition } from '@/domain/types';

export const harvestFestival: EventDefinition = {
  id: 'harvest-festival',
  name: 'Harvest Festival',
  category: 'holiday',
  rarity: 'annual',
  themeId: 'harvest-festival',
  summary:
    'Give thanks for the harvest and remember fallen heroes at the shrines outside the capitals.',
  highlights: ['Visit the memorial shrines', 'Share a festive feast', 'A short, quiet holiday'],
  links: [{ label: 'Warcraft Wiki', url: 'https://warcraft.wiki.gg/wiki/Harvest_Festival' }],
  // Per faction, as Warcraft Wiki describes the current game: not confirmed for a version yet.
  locations: {
    alliance: ['Outside Ironforge'],
    horde: ['Outside Orgrimmar'],
    source: 'https://warcraft.wiki.gg/wiki/Harvest_Festival',
  },
  // Standard yearly schedule (Classic/TBC holiday calendar): Third Monday of September, one week.
  annual: {
    anchor: { type: 'weekday', month: 9, weekday: 1, nth: 3 },
    startTime: '10:00',
    durationDays: 7,
    source: 'https://www.darmory.com/events',
  },
};
