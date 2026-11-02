import type { EventDefinition } from '@/domain/types';

export const stvFishing: EventDefinition = {
  id: 'stv-fishing',
  name: 'Stranglethorn Fishing Extravaganza',
  shortName: 'Fishing',
  category: 'fishing',
  rarity: 'weekly',
  themeId: 'fishing',
  summary:
    'A weekly contest in Stranglethorn Vale: be the first to bring back the rare fish and win.',
  highlights: [
    'First to turn in 40 Speckled Tastyfish wins',
    'Fish the pools along the Stranglethorn coast',
    'Prizes include rare fishing gear',
  ],
  links: [
    {
      label: 'Warcraft Wiki',
      url: 'https://warcraft.wiki.gg/wiki/Stranglethorn_Fishing_Extravaganza',
    },
  ],
  experience: {
    // TBC-era quest page. Later expansions renamed the quest "Grand Prize" and added more prizes.
    anniversary: {
      quests: [
        {
          name: 'Master Angler',
          rewards: ['Arcanite Fishing Pole', 'Hook of the Master Angler'],
          notes: 'Be the first to bring 40 Speckled Tastyfish to Riggle Bassbait in Booty Bay.',
        },
      ],
      notes: "Riggle's apprentice also pays money for every 5 Speckled Tastyfish you bring.",
      source: 'https://www.wowhead.com/tbc/quest=8193/master-angler',
    },
  },
};
