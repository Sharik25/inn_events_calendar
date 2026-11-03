import type { EventDefinition } from '@/domain/types';

export const loveIsInTheAir: EventDefinition = {
  id: 'love-is-in-the-air',
  name: 'Love is in the Air',
  shortName: 'Love in the Air',
  category: 'holiday',
  rarity: 'annual',
  themeId: 'love-is-in-the-air',
  summary: 'Spread kindness in the capital cities with gifts, colognes and perfumes.',
  highlights: [
    'Hand out gifts and gather tokens of love',
    'Charm-themed vendors in the capitals',
    'Seasonal pets and cosmetics',
  ],
  links: [{ label: 'Warcraft Wiki', url: 'https://warcraft.wiki.gg/wiki/Love_is_in_the_Air' }],
  // Standard yearly schedule (Classic/TBC holiday calendar): Second Monday of February, two weeks.
  annual: {
    anchor: { type: 'weekday', month: 2, weekday: 1, nth: 2 },
    startTime: '10:00',
    durationDays: 14,
    source: 'https://www.darmory.com/events',
  },
};
