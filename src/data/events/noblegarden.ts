import type { EventDefinition } from '@/domain/types';

export const noblegarden: EventDefinition = {
  id: 'noblegarden',
  name: 'Noblegarden',
  category: 'holiday',
  rarity: 'annual',
  themeId: 'noblegarden',
  summary: 'Hunt for brightly painted eggs near the starting towns to celebrate spring.',
  highlights: [
    'Collect eggs around the starter villages',
    'Trade chocolate for spring outfits',
    'Rabbit-themed fun',
  ],
  links: [{ label: 'Warcraft Wiki', url: 'https://warcraft.wiki.gg/wiki/Noblegarden' }],
  // Standard yearly schedule (Classic/TBC holiday calendar): Monday after Easter, one week.
  annual: {
    anchor: { type: 'easter', offsetDays: 1 },
    startTime: '10:00',
    durationDays: 7,
    source: 'https://www.darmory.com/events',
  },
};
