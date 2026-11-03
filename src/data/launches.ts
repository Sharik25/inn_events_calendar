import { formatInTimeZone } from 'date-fns-tz';
import type {
  EventDefinition,
  ThemeId,
  VersionEventBinding,
  VersionId,
  VersionLaunch,
} from '@/domain/types';

/** A launch is a moment (like the weekly reset): shown and exported as a single time. */
const LAUNCH_MINUTES = 1;

export function launchEventId(versionId: VersionId, launch: Pick<VersionLaunch, 'id'>): string {
  return `${versionId}-launch-${launch.id}`;
}

/** "Thu, Nov 5, 2026, 00:00 (GMT+1)": the launch in the time zone it was announced in. */
export function launchLocalTime({ at, timeZone }: Pick<VersionLaunch, 'at' | 'timeZone'>): string {
  return formatInTimeZone(new Date(at), timeZone, 'EEE, MMM d, yyyy, HH:mm (O)');
}

/**
 * One event per launch ("WoW: Forever launch (Europe)"), so every part of the world gets its own
 * day, card and calendar entry. `title` is the version's launch title; the label is appended. The
 * summary (also the calendar entry's description) states the local opening time.
 */
export function launchEvents({
  versionId,
  title,
  themeId,
  launches,
}: {
  versionId: VersionId;
  title: string;
  themeId: ThemeId;
  launches: VersionLaunch[];
}): EventDefinition[] {
  return launches.map((launch) => ({
    id: launchEventId(versionId, launch),
    name: `${title} (${launch.label})`,
    shortName: `${launch.label} launch`, // region first: it survives truncation in small cells
    category: 'launch',
    rarity: 'once',
    priority: 100, // a launch leads its day
    themeId,
    summary: `Servers open in ${launch.label} on ${launchLocalTime(launch)}.`,
    ...(launch.source && { links: [{ label: 'Launch announcement', url: launch.source }] }),
  }));
}

/** The bindings for `launchEvents`: each launch at its own moment, the same for every region. */
export function launchBindings(
  versionId: VersionId,
  launches: VersionLaunch[],
): VersionEventBinding[] {
  return launches.map((launch) => ({
    eventId: launchEventId(versionId, launch),
    rule: {
      kind: 'moment',
      at: launch.at,
      durationMinutes: LAUNCH_MINUTES,
      verified: launch.verified,
      ...(launch.source && { source: launch.source }),
      ...(launch.note && { note: launch.note }),
    },
  }));
}
