import type { ScheduleFile, VersionConfig } from '@/domain/types';
import { explicitBindingsFromSchedules, scheduleFilesFromGlob } from '../../schedules';
import { weeklyResetBindings } from '../../weekly-reset';
import { WEEKLY_RESET } from './weekly-reset';

const scheduleFiles = scheduleFilesFromGlob(
  import.meta.glob<ScheduleFile>('./schedule-*.json', { eager: true, import: 'default' }),
);

/**
 * WoW: Forever. Launch: Nov 4, 2026, 3:00 pm PT (worldwide), per
 * https://www.techspot.com/news/113832-world-warcraft-forever-launches-november-4-new-race.html
 * and https://www.warcrafttavern.com/forever/news/warcraft-forever-classic-announced-at-blizzcon-2026/
 *
 * Dated events live in `schedule-<year>.json` next to this file: editing one on GitHub redeploys
 * the site, no code change needed. They stay empty until the post-launch calendar is verified
 * (PLAN.md §14). Weekly/monthly events go in `events` below as rules.
 */
export const forever: VersionConfig = {
  id: 'forever',
  name: 'WoW: Forever',
  shortName: 'Forever',
  status: 'upcoming',
  launchDate: '2026-11-04T15:00:00-08:00',
  summary:
    'A new take on the level-60 world with fresh quests, dungeons and raids. Its event calendar appears here once dates are confirmed after launch.',
  // Realmless: one event clock for everyone. Pacific is assumed until the live calendar is checked.
  regions: [{ id: 'global', label: 'All realms', timeZone: 'America/Los_Angeles' }],
  defaultRegionId: 'global',
  baseThemeId: 'forever',
  events: [...explicitBindingsFromSchedules(scheduleFiles), ...weeklyResetBindings(WEEKLY_RESET)],
};
