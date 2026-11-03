import type { EventDefinition } from '@/domain/types';
import { launchEvents } from '../launches';
import { FOREVER_LAUNCHES } from '../versions/forever/launches';

/** WoW: Forever's launch, one event per part of the world (dates: versions/forever/launches.ts). */
export const foreverLaunch: EventDefinition[] = launchEvents({
  versionId: 'forever',
  title: 'WoW: Forever launch',
  themeId: 'forever-launch',
  launches: FOREVER_LAUNCHES,
});
