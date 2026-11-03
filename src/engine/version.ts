import type { CalendarExportConfig, VersionConfig, VersionLaunch } from '@/domain/types';

/** Calendar export for versions that don't set `calendarExport`: whole events, Day view only. */
export const DEFAULT_CALENDAR_EXPORT: CalendarExportConfig = {
  scopes: ['event'],
  onEveryEvent: false,
};

/** The version's calendar export options (its own, else the default). */
export function calendarExportOf(version: Pick<VersionConfig, 'calendarExport'>) {
  return version.calendarExport ?? DEFAULT_CALENDAR_EXPORT;
}

/** A launch with its moment parsed. */
export interface LaunchMoment {
  launch: VersionLaunch;
  at: Date;
}

/** The version's launches with valid moments, earliest first. */
export function launchMoments(version: Pick<VersionConfig, 'launches'>): LaunchMoment[] {
  return (version.launches ?? [])
    .map((launch) => ({ launch, at: new Date(launch.at) }))
    .filter(({ at }) => !Number.isNaN(at.getTime()))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** The version's first launch instant (it's live from then on), if it has one. */
export function launchInstant(version: Pick<VersionConfig, 'launches'>): Date | null {
  return launchMoments(version)[0]?.at ?? null;
}

/**
 * Launches still ahead at `now`. Each region's launch drops out at its own moment, so the
 * countdown needs no redeploy and never outlives the launch.
 */
export function pendingLaunches(
  version: Pick<VersionConfig, 'launches'>,
  now: Date,
): LaunchMoment[] {
  return launchMoments(version).filter(({ at }) => at > now);
}

/**
 * Effective status at `now`: an 'upcoming' version becomes live once its first launch passes,
 * so the app needs no redeploy on launch day.
 */
export function versionStatus(version: VersionConfig, now: Date): VersionConfig['status'] {
  if (version.status !== 'upcoming') return version.status;
  const launch = launchInstant(version);
  return launch && now >= launch ? 'live' : 'upcoming';
}

/** Same view and date in another version: /anniversary/week/2026-10-25 → /forever/week/2026-10-25. */
export function switchVersionPath(pathname: string, fromId: string, toId: string): string {
  const prefix = `/${fromId}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return `/${toId}${pathname.slice(prefix.length)}`;
  }
  return `/${toId}/today`;
}
