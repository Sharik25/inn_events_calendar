import type { ScheduleFile, VersionConfig } from '@/domain/types';
import { eventDefinitions } from '../../events';
import { launchBindings } from '../../launches';
import { scheduleBindings, scheduleFilesFromGlob } from '../../schedules';
import { weeklyResetBindings } from '../../weekly-reset';
import { FOREVER_LAUNCHES } from './launches';
import { WEEKLY_RESET } from './weekly-reset';

const scheduleFiles = scheduleFilesFromGlob(
  import.meta.glob<ScheduleFile>('./schedule-*.json', { eager: true, import: 'default' }),
);

/**
 * WoW: Forever. Launch: Nov 4, 2026, 3:00 pm PT, the same moment worldwide (midnight Nov 5 in
 * Paris); the launches per part of the world are in `launches.ts`.
 *
 * Dated events live in `schedule-<year>.json` next to this file: editing one on GitHub redeploys
 * the site, no code change needed. As of Nov 3, 2026 Wowhead lists no world events for Forever:
 * the Darkmoon Faire visits come from the game client (unconfirmed, see the JSON notes), and every
 * yearly holiday and the weekly fishing contest are estimated from the standard schedule (shown as
 * "Estimated") until Forever's own dates are known. Weekly/monthly events go in `events` below as
 * rules once a source confirms them.
 */
export const forever: VersionConfig = {
  id: 'forever',
  name: 'WoW: Forever',
  shortName: 'Forever',
  status: 'upcoming',
  // Launch days, countdown lines and calendar entries per part of the world. The first launch
  // switches the version from "upcoming" to live.
  launches: FOREVER_LAUNCHES,
  summary:
    'A new take on the level-60 world with fresh quests, dungeons and raids. Its calendar fills in as event dates are confirmed.',
  // Realmless: one event clock for everyone. Pacific is assumed until the live calendar is checked.
  regions: [{ id: 'global', label: 'All realms', timeZone: 'America/Los_Angeles' }],
  defaultRegionId: 'global',
  baseThemeId: 'forever',
  // Quiet day at the inn: the Anniversary inn exactly (its theme and classic shapes), with
  // Forever's own blue stars on top as the one Forever touch.
  quietDay: { themeId: 'base', uiStyle: 'classic', ambientThemeId: 'forever' },
  // Same design, slightly more modern: tune it in src/styles/version-styles.css.
  uiStyle: 'modern',
  events: [
    // Every yearly holiday and weekly event (the fishing contest), estimated from the standard
    // schedule until Forever's own dates are known; a date added to schedule-<year>.json
    // replaces a holiday's estimate for that year.
    ...scheduleBindings(scheduleFiles, { events: eventDefinitions, estimateStandard: true }),
    ...weeklyResetBindings(WEEKLY_RESET),
    ...launchBindings('forever', FOREVER_LAUNCHES),
  ],
};
