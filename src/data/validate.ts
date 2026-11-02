import type { z } from 'zod';
import { eventDefinitionSchema, versionConfigSchema } from '@/domain/schemas';
import type { EventDefinition, ScheduleRule, VersionConfig } from '@/domain/types';
import { isValidTimeZone, wallTimeToInstant } from '@/engine/time';

export interface DataSet {
  events: EventDefinition[];
  versions: VersionConfig[];
  themeIds: readonly string[];
}

function zodIssues(where: string, error: z.ZodError): string[] {
  return error.issues.map((i) => `${where}: ${i.path.join('.') || '(root)'} ${i.message}`);
}

function duplicates(ids: string[]): string[] {
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
}

function ruleIssues(where: string, rule: ScheduleRule, timeZone: string): string[] {
  if (rule.kind === 'monthly') {
    if (rule.rotationAnchor && !rule.rotation) return [`${where}: rotationAnchor without rotation`];
    if (rule.rotation && !rule.rotationAnchor) return [`${where}: rotation without rotationAnchor`];
    return [];
  }
  if (rule.kind !== 'explicit') return [];

  const issues: string[] = [];
  const spans = rule.occurrences.map((o) => ({
    label: o.start,
    start: wallTimeToInstant(o.start, timeZone),
    end: wallTimeToInstant(o.end, timeZone),
  }));
  for (const span of spans) {
    if (span.end <= span.start)
      issues.push(`${where}: occurrence ${span.label} ends before it starts`);
  }
  const sorted = [...spans].sort((a, b) => a.start.getTime() - b.start.getTime());
  sorted.forEach((cur, i) => {
    const prev = sorted[i - 1];
    if (prev && cur.start < prev.end) {
      issues.push(`${where}: occurrences ${prev.label} and ${cur.label} overlap`);
    }
  });
  return issues;
}

/** Validates the whole data set (PLAN.md §5). Returns human-readable issues; empty = valid. */
export function validateData({ events, versions, themeIds }: DataSet): string[] {
  const issues: string[] = [];
  const themes = new Set(themeIds);

  for (const event of events) {
    const parsed = eventDefinitionSchema.safeParse(event);
    if (!parsed.success) issues.push(...zodIssues(`event "${event.id}"`, parsed.error));
    if (!themes.has(event.themeId)) {
      issues.push(`event "${event.id}": unknown themeId "${event.themeId}"`);
    }
  }
  for (const id of duplicates(events.map((e) => e.id))) issues.push(`duplicate event id "${id}"`);
  for (const id of duplicates(versions.map((v) => v.id)))
    issues.push(`duplicate version id "${id}"`);

  const eventIds = new Set(events.map((e) => e.id));
  const versionIds = new Set(versions.map((v) => v.id));
  for (const event of events) {
    for (const versionId of Object.keys(event.experience ?? {})) {
      if (!versionIds.has(versionId))
        issues.push(`event "${event.id}": experience for unknown version "${versionId}"`);
    }
  }

  for (const version of versions) {
    const where = `version "${version.id}"`;
    const parsed = versionConfigSchema.safeParse(version);
    if (!parsed.success) {
      issues.push(...zodIssues(where, parsed.error));
      continue;
    }
    if (!themes.has(version.baseThemeId)) {
      issues.push(`${where}: unknown baseThemeId "${version.baseThemeId}"`);
    }
    const regionIds = version.regions.map((r) => r.id);
    for (const id of duplicates(regionIds)) issues.push(`${where}: duplicate region "${id}"`);
    if (!regionIds.includes(version.defaultRegionId)) {
      issues.push(`${where}: defaultRegionId "${version.defaultRegionId}" is not a region`);
    }
    const badZones = version.regions.filter((r) => !isValidTimeZone(r.timeZone));
    for (const r of badZones)
      issues.push(`${where}: region "${r.id}" has invalid time zone "${r.timeZone}"`);
    if (badZones.length) continue;

    for (const id of duplicates(version.events.map((b) => b.eventId))) {
      issues.push(`${where}: event "${id}" is bound more than once`);
    }
    for (const binding of version.events) {
      const bw = `${where} event "${binding.eventId}"`;
      if (!eventIds.has(binding.eventId)) issues.push(`${bw}: not in the event catalog`);
      for (const region of version.regions) {
        issues.push(...ruleIssues(`${bw} [${region.id}]`, binding.rule, region.timeZone));
      }
      for (const regionId of binding.regions ?? []) {
        if (!regionIds.includes(regionId))
          issues.push(`${bw}: regions lists unknown "${regionId}"`);
      }
      for (const [regionId, rule] of Object.entries(binding.regionRules ?? {})) {
        const region = version.regions.find((r) => r.id === regionId);
        if (!region) issues.push(`${bw}: regionRules for unknown region "${regionId}"`);
        else issues.push(...ruleIssues(`${bw} [${regionId} override]`, rule, region.timeZone));
      }
    }
  }
  return issues;
}
