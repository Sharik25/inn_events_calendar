import type { EventDefinition } from '@/domain/types';

export const midsummer: EventDefinition = {
  id: 'midsummer',
  name: 'Midsummer Fire Festival',
  shortName: 'Midsummer',
  category: 'holiday',
  rarity: 'annual',
  themeId: 'midsummer',
  summary:
    'Bonfires burn in every zone to celebrate the summer solstice, and the Frost Lord Ahune stirs.',
  highlights: [
    'Honor or desecrate bonfires across the world',
    'Face Lord Ahune in the Slave Pens',
    'Toss torches and juggle fire',
  ],
  links: [{ label: 'Warcraft Wiki', url: 'https://warcraft.wiki.gg/wiki/Midsummer_Fire_Festival' }],
  // Standard yearly schedule (Classic/TBC holiday calendar): June 21 to July 5.
  annual: {
    anchor: { type: 'date', month: 6, day: 21 },
    startTime: '10:00',
    durationDays: 14,
    source: 'https://www.darmory.com/events',
  },
};
