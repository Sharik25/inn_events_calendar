import type { EventDefinition } from '@/domain/types';

export const darkmoonFaire: EventDefinition = {
  id: 'darkmoon-faire',
  name: 'Darkmoon Faire',
  category: 'faire',
  rarity: 'monthly',
  themeId: 'darkmoon-faire',
  summary:
    "Silas Darkmoon's travelling carnival brings games, prizes and fortunes for a week each month.",
  highlights: [
    'Turn in Darkmoon cards and decks',
    'Play games for prize tickets',
    'Get your fortune told',
  ],
  links: [
    { label: 'Warcraft Wiki', url: 'https://warcraft.wiki.gg/wiki/Darkmoon_Faire_(Classic)' },
  ],
  experience: {
    // Experience as each quest's Wowhead Forever page lists it (checked Nov 9, 2026). Wowhead's
    // Forever experience calculator: "Quests pay less once you are six or more levels above them",
    // so the level-55 decks pay in full through level 60 (Forever's cap, per Blizzard), and the
    // level-60 welcome quest pays in full at every level.
    forever: {
      quests: [
        {
          name: 'The Darkmoon Faire',
          level: { min: 6 },
          xp: { amount: 660 },
          notes: 'One for each faction (Alliance and Horde); both pay the same.',
          source: 'https://www.wowhead.com/forever/quest=7905/the-darkmoon-faire',
        },
        {
          name: 'Darkmoon Beast Deck',
          level: { min: 1 },
          xp: { amount: 560, fullUpToLevel: 60 },
          source: 'https://www.wowhead.com/forever/quest=7907/darkmoon-beast-deck',
        },
        {
          name: 'Darkmoon Portals Deck',
          level: { min: 1 },
          xp: { amount: 560, fullUpToLevel: 60 },
          source: 'https://www.wowhead.com/forever/quest=7927/darkmoon-portals-deck',
        },
        {
          name: 'Darkmoon Warlords Deck',
          level: { min: 1 },
          xp: { amount: 560, fullUpToLevel: 60 },
          source: 'https://www.wowhead.com/forever/quest=7928/darkmoon-warlords-deck',
        },
        {
          name: 'Darkmoon Elementals Deck',
          level: { min: 1 },
          xp: { amount: 560, fullUpToLevel: 60 },
          source: 'https://www.wowhead.com/forever/quest=7929/darkmoon-elementals-deck',
        },
      ],
      notes:
        'Experience as Wowhead lists it for Forever. Quests pay less once you are six or more levels above them.',
      source: 'https://www.wowhead.com/forever/experience-calculator',
    },
  },
};
