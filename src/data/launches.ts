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

/** "Thu, Nov 5, 2026, 00:00" and "GMT+1": the launch in the time zone it was announced in. */
function localParts({ at, timeZone }: Pick<VersionLaunch, 'at' | 'timeZone'>) {
  const instant = new Date(at);
  return {
    when: formatInTimeZone(instant, timeZone, 'EEE, MMM d, yyyy, HH:mm'),
    zone: formatInTimeZone(instant, timeZone, 'O'),
  };
}

/** "Thu, Nov 5, 2026, 00:00 (GMT+1)" */
export function launchLocalTime(launch: Pick<VersionLaunch, 'at' | 'timeZone'>): string {
  const { when, zone } = localParts(launch);
  return `${when} (${zone})`;
}

/**
 * Launches grouped by moment, in data order: parts of the world that open at the same instant
 * share one event (one card, one calendar entry); a staggered launch gets one per moment.
 */
export function launchGroups(launches: VersionLaunch[]): VersionLaunch[][] {
  const groups = new Map<number, VersionLaunch[]>();
  for (const launch of launches) {
    const at = new Date(launch.at).getTime();
    groups.set(at, [...(groups.get(at) ?? []), launch]);
  }
  return [...groups.values()];
}

/** "A and B", "A, B and C". */
function listOf(items: string[]): string {
  return items.length < 2
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/** `forever-launch-eu-na`: stable as long as the group's regions stay the same. */
export function launchEventId(versionId: VersionId, group: Pick<VersionLaunch, 'id'>[]): string {
  return `${versionId}-launch-${group.map((l) => l.id).join('-')}`;
}

/**
 * One event per launch moment: "WoW: Forever launch (Europe & America)" when both open together,
 * "… (Europe)" alone otherwise. `title` is the version's launch title; the regions are appended.
 * The summary (also the calendar entry's description) states each region's local opening time.
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
  return launchGroups(launches).map((group) => {
    const regions = group.map((l) => l.label).join(' & ');
    const [only] = group;
    const sources = group.flatMap(({ label, source }) => (source ? [{ label, source }] : []));
    return {
      id: launchEventId(versionId, group),
      name: `${title} (${regions})`,
      shortName: `${regions} launch`, // regions first: they survive truncation in small cells
      category: 'launch',
      rarity: 'once',
      priority: 100, // a launch leads its day
      themeId,
      summary:
        group.length === 1 && only
          ? `Servers open in ${only.label} on ${launchLocalTime(only)}.`
          : `Servers open at the same moment in ${listOf(
              group.map((l) => {
                const { when, zone } = localParts(l);
                return `${l.label} (${when} ${zone})`;
              }),
            )}.`,
      ...(sources.length > 0 && {
        links: sources.map(({ label, source }) => ({
          label: sources.length > 1 ? `Launch announcement (${label})` : 'Launch announcement',
          url: source,
        })),
      }),
    };
  });
}

/** The bindings for `launchEvents`: each launch moment, the same instant for every region. */
export function launchBindings(
  versionId: VersionId,
  launches: VersionLaunch[],
): VersionEventBinding[] {
  return launchGroups(launches).flatMap((group) => {
    const [first] = group;
    if (!first) return [];
    const source = group.find((l) => l.source)?.source;
    const notes = group.flatMap((l) => (l.note ? [`${l.label}: ${l.note}`] : []));
    return [
      {
        eventId: launchEventId(versionId, group),
        rule: {
          kind: 'moment' as const,
          at: first.at,
          durationMinutes: LAUNCH_MINUTES,
          verified: group.every((l) => l.verified),
          ...(source && { source }),
          ...(notes.length > 0 && { note: notes.join(' ') }),
        },
      },
    ];
  });
}
