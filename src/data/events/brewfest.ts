import type { EventDefinition } from '@/domain/types';

export const brewfest: EventDefinition = {
  id: 'brewfest',
  name: 'Brewfest',
  category: 'holiday',
  rarity: 'annual',
  themeId: 'brewfest',
  summary: 'Dwarves and goblins throw a beer-soaked festival outside Ironforge and Orgrimmar.',
  highlights: [
    'Ram racing and keg deliveries',
    'Sample brews and gather tokens',
    'Seasonal boss and themed rewards',
  ],
  links: [{ label: 'Warcraft Wiki', url: 'https://warcraft.wiki.gg/wiki/Brewfest' }],
  // Standard yearly schedule (Classic/TBC holiday calendar): September 20 to October 6.
  annual: {
    anchor: { type: 'date', month: 9, day: 20 },
    startTime: '10:00',
    durationDays: 16,
    source: 'https://www.wowhead.com/guide/world-events/holidays/brewfest',
  },
};
