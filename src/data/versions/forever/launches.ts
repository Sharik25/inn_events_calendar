import type { VersionLaunch } from '@/domain/types';

/**
 * WoW: Forever launches worldwide at one moment: Nov 4, 2026, 15:00 Pacific, which is midnight
 * going into Nov 5 in Paris. Europe and America are listed separately so each gets its own launch
 * day, countdown line and calendar entry; if Blizzard ever staggers them, edit `at` here.
 */
export const FOREVER_LAUNCHES: VersionLaunch[] = [
  {
    id: 'eu',
    label: 'Europe',
    at: '2026-11-05T00:00:00+01:00',
    timeZone: 'Europe/Paris',
    verified: true,
    source:
      'https://www.playnews.gg/heures-de-sortie/world-of-warcraft-forever-date-et-heure-de-sortie-minuit-le-5-novembre-a-paris',
  },
  {
    id: 'na',
    label: 'America',
    at: '2026-11-04T15:00:00-08:00',
    timeZone: 'America/Los_Angeles',
    verified: true,
    source:
      'https://www.techspot.com/news/113832-world-warcraft-forever-launches-november-4-new-race.html',
  },
];
