import type { ScheduleFile, VersionConfig } from '@/domain/types';
import { eventDefinitions } from '../../events';
import { scheduleBindings, scheduleFilesFromGlob } from '../../schedules';
import { weeklyResetBindings } from '../../weekly-reset';
import { DARKMOON_ROTATION } from './darkmoon-rotation';
import { WEEKLY_RESET } from './weekly-reset';

const scheduleFiles = scheduleFilesFromGlob(
  import.meta.glob<ScheduleFile>('./schedule-*.json', { eager: true, import: 'default' }),
);

export const anniversary: VersionConfig = {
  id: 'anniversary',
  name: 'Anniversary (TBC Classic)',
  shortName: 'Anniversary',
  status: 'live',
  regions: [
    // Americas realms share one event clock. Pacific time is an assumption based on the 2020
    // Classic hotfix that aligned Americas battleground holidays to US-West timing. Verify in-game.
    { id: 'us', label: 'Americas', timeZone: 'America/Los_Angeles' },
    { id: 'eu', label: 'Europe', timeZone: 'Europe/Paris' },
  ],
  defaultRegionId: 'eu',
  baseThemeId: 'base',
  events: [
    // Hand-tracked dates only (schedule-<year>.json); no estimates.
    ...scheduleBindings(scheduleFiles, { events: eventDefinitions }),
    {
      eventId: 'darkmoon-faire',
      // Arrives the first Friday of the month, opens the following Monday, leaves after Sunday.
      // Opening time of day and the location rotation are unconfirmed for Anniversary realms.
      rule: {
        kind: 'monthly',
        anchor: { weekday: 5, nth: 1 },
        offsetDays: 3,
        startTime: '00:00',
        durationDays: 7,
        verified: false,
        source:
          'https://www.warcrafttavern.com/tbc/news/darkmoon-faire-hotfixed-will-open-next-week-in-tbc-anniversary/',
        // Locations: see darkmoon-rotation.ts (TODO: verified order still needed).
        ...(DARKMOON_ROTATION && {
          rotation: DARKMOON_ROTATION.order,
          rotationAnchor: DARKMOON_ROTATION.anchorMonth,
        }),
      },
      notes: 'Rotates between Elwynn Forest, Mulgore and Terokkar Forest; order unconfirmed.',
    },
    {
      eventId: 'stv-fishing',
      rule: {
        kind: 'weekly',
        weekday: 0,
        startTime: '14:00',
        durationMinutes: 120,
        verified: true,
        source: 'https://warcraft.wiki.gg/wiki/School_of_Tastyfish',
      },
    },
    ...weeklyResetBindings(WEEKLY_RESET),
  ],
};
