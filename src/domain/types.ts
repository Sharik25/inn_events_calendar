/** Core domain types (PLAN.md §5). Mirrored by Zod schemas in `schemas.ts`. */

export type VersionId = string; // 'anniversary' | 'forever' | future
export type EventId = string; // 'hallows-end'
export type ThemeId = string; // 'hallows-end' | 'base'

export type Rarity = 'weekly' | 'monthly' | 'seasonal' | 'annual' | 'once';

export type EventCategory = 'holiday' | 'faire' | 'fishing' | 'world' | 'pvp' | 'milestone';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

/** Version-agnostic description of an event. */
export interface EventDefinition {
  id: EventId;
  name: string; // "Hallow's End"
  shortName?: string; // for small cells
  category: EventCategory;
  rarity: Rarity;
  priority?: number; // tie-breaker for dominance, default 0
  themeId: ThemeId; // which theme styles the day when dominant
  summary: string; // one sentence
  highlights?: string[]; // rewards / things to do (short bullets)
  links?: { label: string; url: string }[];
  /** Experience & rewards per version id (they differ between versions). Shown when present. */
  experience?: Record<VersionId, EventExperience>;
  /**
   * Extra checklist items per version id (achievements, tasks). Quests from `experience` are
   * added automatically; see engine/checklist.ts.
   */
  checklist?: Record<VersionId, ChecklistItem[]>;
}

export type ChecklistItemKind = 'quest' | 'achievement' | 'task';

/** One thing to tick off during an event. `id` must stay stable: saved progress refers to it. */
export interface ChecklistItem {
  id: string;
  kind: ChecklistItemKind;
  name: string;
  source?: string; // URL
}

export interface LevelRange {
  min: number;
  max?: number;
}

/**
 * Experience and rewards of an event in one version. Only facts stated by `source` (never
 * estimates); every field but `source` is optional, and at least one must be set.
 */
export interface EventExperience {
  xpBonus?: string; // as worded by the source, e.g. "+10% experience from kills"
  levelRange?: LevelRange;
  quests?: { name: string; level?: LevelRange; rewards?: string[]; notes?: string }[];
  rewards?: string[];
  notes?: string;
  source: string; // URL
}

export type EventCatalog = Record<EventId, EventDefinition>;

/** One explicitly dated occurrence. Times are wall-clock server time of the region. */
export interface ExplicitOccurrence {
  start: string; // ISO local, e.g. "2026-10-18T10:00"
  end: string;
  verified: boolean;
  source?: string; // URL
  note?: string; // e.g. which part is unconfirmed
}

/** How an event is scheduled in a specific version. */
export type ScheduleRule =
  | {
      kind: 'explicit'; // holidays: dates shift yearly
      occurrences: ExplicitOccurrence[];
    }
  | {
      kind: 'weekly'; // e.g. fishing contest
      weekday: Weekday;
      startTime: string; // "14:00" (server time)
      durationMinutes: number;
      verified: boolean;
      source?: string;
    }
  | {
      kind: 'monthly'; // e.g. Darkmoon Faire
      anchor: { weekday: Weekday; nth: 1 | 2 | 3 | 4 | 'last' }; // "1st Friday"
      offsetDays?: number; // shift from anchor (may be negative)
      startTime: string;
      durationDays: number;
      rotation?: string[]; // locations cycling per month
      rotationAnchor?: string; // "YYYY-MM": the month in which rotation[0] applies
      verified: boolean;
      source?: string;
    };

export type ScheduleRuleKind = ScheduleRule['kind'];

export interface Region {
  id: string; // 'us' | 'eu' | 'oce' ...
  label: string;
  timeZone: string; // IANA, server time of the region
}

export interface VersionEventBinding {
  eventId: EventId;
  rule: ScheduleRule;
  /** Per-region overrides when regions differ (optional). */
  regionRules?: Record<string, ScheduleRule>;
  /** Only these regions have the event (e.g. a reset time verified for one region only). */
  regions?: string[];
  notes?: string; // version-specific nuance, e.g. "includes Ahune"
}

export interface VersionConfig {
  id: VersionId;
  name: string; // "Anniversary (TBC Classic)"
  shortName: string; // "Anniversary"
  status: 'live' | 'upcoming' | 'retired';
  launchDate?: string; // ISO
  /** One or two sentences shown on the upcoming-version screen. */
  summary?: string;
  regions: Region[];
  defaultRegionId: string;
  events: VersionEventBinding[];
  baseThemeId: ThemeId; // theme when no event is dominant
}

/** A `schedule-<year>.json` file: explicit dates for one version and one year. */
export interface ScheduleFile {
  year: number;
  notes?: string;
  events: Record<EventId, ExplicitOccurrence[]>;
}

/** Engine output. Dates are absolute instants (UTC-backed Date). */
export interface Occurrence {
  key: string; // `${versionId}:${eventId}:${startISO}`
  eventId: EventId;
  versionId: VersionId;
  start: Date;
  end: Date;
  verified: boolean;
  location?: string; // from rotation
  source?: string;
  note?: string;
}

/** Half-open instant range [start, end). */
export interface DateRange {
  start: Date;
  end: Date;
}
