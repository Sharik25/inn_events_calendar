import type { EventDefinition } from '@/domain/types';

/**
 * Battleground holiday weeks ("Call to Arms"): one highlighted battleground pays more Honor and
 * Rank Points for a week. Blizzard confirms the weeks for Forever, but has published no
 * schedule; the dates come from Wowhead's Forever calendar (versions/forever/schedule-<year>.json,
 * whose Wowhead link the details show as "Date source"). No `weekly`/`annual` slot on purpose, so
 * no version estimates them, and Anniversary doesn't list them.
 *
 * TODO: the rotation after Nov 24, 2026 is unknown (Wowhead lists three weeks: Arathi Basin,
 * Warsong Gulch, Darkspear Islands). Add later weeks to the schedule file once they are listed.
 * Alterac Valley has a Call to Arms entry on Wowhead but no Forever date, so it is left out.
 */
const PVP_PROGRESSION = {
  label: 'Blizzard: PvP progression in Forever',
  url: 'https://worldofwarcraft.blizzard.com/en-us/news/24303316',
};

function callToArms(
  battleground: string,
  extra: { highlights?: string[]; links?: EventDefinition['links'] } = {},
): EventDefinition {
  return {
    id: `call-to-arms-${battleground.toLowerCase().replace(/ /g, '-')}`,
    name: `Call to Arms: ${battleground}`,
    // Just the battleground in small cells: the crimson PvP theme marks it, and a "PvP: " prefix
    // made "Coming soon" chips wrap (and shift) on phones once the display font loads.
    shortName: battleground,
    category: 'pvp',
    rarity: 'weekly',
    themeId: 'pvp',
    summary: `${battleground}'s battleground holiday week: it pays more Honor and Rank Points.`,
    highlights: [
      `Increased Honor in ${battleground} all week`,
      `Extra Rank Points from ${battleground}`,
      ...(extra.highlights ?? []),
    ],
    links: [PVP_PROGRESSION, ...(extra.links ?? [])],
  };
}

export const callToArmsEvents: EventDefinition[] = [
  callToArms('Arathi Basin'),
  callToArms('Warsong Gulch'),
  callToArms('Darkspear Islands', {
    highlights: ['15v15, levels 30–60, first team to 2,000 points wins'],
    links: [
      {
        label: 'Blizzard: Darkspear Islands',
        url: 'https://news.blizzard.com/en-us/article/24307308/battle-for-the-darkspear-islands-in-world-of-warcraft-forever',
      },
    ],
  }),
];
