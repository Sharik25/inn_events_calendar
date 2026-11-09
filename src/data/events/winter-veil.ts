import type { EventDefinition } from '@/domain/types';

export const winterVeil: EventDefinition = {
  id: 'winter-veil',
  name: 'Feast of Winter Veil',
  shortName: 'Winter Veil',
  category: 'holiday',
  rarity: 'annual',
  themeId: 'winter-veil',
  summary: 'Greatfather Winter brings gifts, snowballs and seasonal cheer to the capitals.',
  highlights: [
    'Gifts under the tree on Winter Veil morning',
    'Snowball fights and festive outfits',
    'Seasonal quests and recipes',
  ],
  links: [{ label: 'Warcraft Wiki', url: 'https://warcraft.wiki.gg/wiki/Feast_of_Winter_Veil' }],
  // Per faction, as Warcraft Wiki describes the current game: not confirmed for a version yet.
  locations: {
    what: 'Greatfather Winter visits',
    alliance: ['Ironforge'],
    horde: ['Orgrimmar'],
    source: 'https://warcraft.wiki.gg/wiki/Feast_of_Winter_Veil',
  },
  // Standard yearly schedule (Classic/TBC holiday calendar): December 15 to January 2.
  annual: {
    anchor: { type: 'date', month: 12, day: 15 },
    startTime: '10:00',
    durationDays: 18,
    source: 'https://www.darmory.com/events',
  },
};
