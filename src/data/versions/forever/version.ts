import type { ScheduleFile, VersionConfig } from '@/domain/types';
import { eventDefinitions } from '../../events';
import { scheduleBindings, scheduleFilesFromGlob } from '../../schedules';
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
 * the site, no code change needed. As of Nov 3, 2026 Wowhead lists no world events for Forever:
 * the Darkmoon Faire visits come from the game client (unconfirmed, see the JSON notes), and every
 * yearly holiday is estimated from the standard schedule (shown as "Estimated") until Forever's own
 * dates are known. Weekly/monthly events go in `events` below as rules once a source confirms them.
 */
/** Launch moment: drives the launch countdown and the switch from "upcoming" to live. */
export const FOREVER_LAUNCH = '2026-11-04T15:00:00-08:00';

export const forever: VersionConfig = {
  id: 'forever',
  name: 'WoW: Forever',
  shortName: 'Forever',
  status: 'upcoming',
  launchDate: FOREVER_LAUNCH,
  summary:
    'A new take on the level-60 world with fresh quests, dungeons and raids. Its calendar fills in as event dates are confirmed.',
  // Realmless: one event clock for everyone. Pacific is assumed until the live calendar is checked.
  regions: [{ id: 'global', label: 'All realms', timeZone: 'America/Los_Angeles' }],
  defaultRegionId: 'global',
  baseThemeId: 'forever',
  // Quiet days: the Anniversary inn's brown with Forever's sea-blue accent (themes/forever-inn).
  quietThemeId: 'forever-inn',
  // Same design, slightly more modern: tune it in src/styles/version-styles.css.
  uiStyle: 'modern',
  events: [
    // Every yearly holiday, estimated from the standard schedule until Forever's own dates are
    // known; a date added to schedule-<year>.json replaces the estimate for that year.
    ...scheduleBindings(scheduleFiles, { events: eventDefinitions, estimateYearly: true }),
    ...weeklyResetBindings(WEEKLY_RESET),
  ],
};
