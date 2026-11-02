import type { DateRange, Occurrence, VersionConfig } from '@/domain/types';
import { expandRule } from './rules';

export function findRegion(version: VersionConfig, regionId: string) {
  const region = version.regions.find((r) => r.id === regionId);
  if (!region) {
    throw new Error(`Unknown region "${regionId}" for version "${version.id}"`);
  }
  return region;
}

export function occurrenceKey(versionId: string, eventId: string, start: Date): string {
  return `${versionId}:${eventId}:${start.toISOString()}`;
}

/**
 * All occurrences of a version's events in a region that intersect `range`,
 * sorted by start then event id. Duplicate keys are collapsed.
 */
export function expandOccurrences(
  version: VersionConfig,
  regionId: string,
  range: DateRange,
): Occurrence[] {
  const region = findRegion(version, regionId);
  const byKey = new Map<string, Occurrence>();

  for (const binding of version.events) {
    if (binding.regions && !binding.regions.includes(regionId)) continue;
    const rule = binding.regionRules?.[regionId] ?? binding.rule;
    for (const raw of expandRule(rule, { timeZone: region.timeZone, range })) {
      const key = occurrenceKey(version.id, binding.eventId, raw.start);
      if (!byKey.has(key)) {
        byKey.set(key, { key, eventId: binding.eventId, versionId: version.id, ...raw });
      }
    }
  }

  return [...byKey.values()].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.eventId.localeCompare(b.eventId),
  );
}
