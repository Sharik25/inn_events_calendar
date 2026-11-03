/** Core domain types (PLAN.md §5). Mirrored by Zod schemas in `schemas.ts`. */

export type VersionId = string; // 'anniversary' | 'forever' | future
export type EventId = string; // 'hallows-end'
export type ThemeId = string; // 'hallows-end' | 'base'

export type Rarity = 'weekly' | 'monthly' | 'seasonal' | 'annual' | 'once';

export type EventCategory =
  'holiday' | 'faire' | 'fishing' | 'world' | 'pvp' | 'launch' | 'milestone';

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
  /**
   * Where this holiday falls in the standard (Classic/TBC) yearly schedule. Versions without
   * confirmed dates can estimate from it (see data/schedules.ts).
   */
  annual?: AnnualSchedule;
  /** Its slot in the standard (Classic/TBC) weekly schedule, e.g. the Sunday fishing contest. */
  weekly?: WeeklySchedule;
}

/** A recurring event's slot in the standard weekly schedule (version-agnostic). */
export interface WeeklySchedule {
  weekday: Weekday;
  startTime: string; // "14:00", server time
  durationMinutes: number;
  source: string; // URL of the standard schedule this follows
}

/** How a holiday's start day is found each year. */
export type AnnualAnchor =
  | { type: 'date'; month: number; day: number } // Oct 18
  | { type: 'weekday'; month: number; weekday: Weekday; nth: 1 | 2 | 3 | 4 | 'last' } // 2nd Mon of Feb
  | { type: 'easter'; offsetDays: number } // Monday after Easter: 1
  | { type: 'lunar-new-year'; offsetDays: number }; // day before: -1

/** A holiday's slot in the standard yearly schedule (version-agnostic). */
export interface AnnualSchedule {
  anchor: AnnualAnchor;
  startTime: string; // "10:00", server time
  durationDays: number;
  source: string; // URL of the standard schedule this follows
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
  location?: string; // where it takes place this time (e.g. a Darkmoon Faire site)
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
      /** Estimated from the standard weekly schedule, not from a source for this version. */
      estimated?: boolean;
      source?: string;
      note?: string;
    }
  | {
      kind: 'annual'; // holidays estimated from the standard yearly schedule
      anchor: AnnualAnchor;
      startTime: string; // "10:00" (server time)
      durationDays: number;
      verified: boolean;
      /** Dates derived from the standard schedule, not from a source for this version. */
      estimated?: boolean;
      source?: string;
      note?: string;
      /** Real dates for specific years: each replaces the rule's date in the year it starts. */
      overrides?: ExplicitOccurrence[];
    }
  | {
      kind: 'moment'; // one absolute instant, the same everywhere (e.g. a worldwide launch)
      at: string; // ISO with offset, e.g. "2026-11-04T15:00:00-08:00"
      durationMinutes: number;
      verified: boolean;
      source?: string;
      note?: string;
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

/**
 * How a version dresses its quiet day at the inn. Defaults: the version's base theme and uiStyle,
 * no extra ambience. `ambientThemeId` layers another theme's particles and decorations (only
 * those, not its colors) on top, e.g. Forever's blue stars over the Anniversary inn.
 */
export interface QuietDayStyle {
  themeId?: ThemeId;
  uiStyle?: 'classic' | 'modern';
  ambientThemeId?: ThemeId;
}

/**
 * A version's launch in one part of the world (e.g. Europe, America). Each becomes its own
 * event (`<version>-launch-<id>`, see data/launches.ts), with the launch countdown counting down
 * to the ones still ahead.
 */
export interface VersionLaunch {
  id: string; // 'eu' | 'na': part of the event id, keep stable
  label: string; // "Europe"
  at: string; // ISO with offset: the moment servers open
  timeZone: string; // IANA zone the launch time is announced in, e.g. "Europe/Paris"
  verified: boolean;
  source?: string; // URL that states this launch time
  note?: string;
}

/** What "Add to calendar" can add: the whole event, or only the viewed day of it. */
export type CalendarExportScope = 'event' | 'day';

/**
 * A version's calendar export options. Default (unset): whole events only, from the Day view's
 * main event. See engine/version.ts `calendarExportOf`.
 */
export interface CalendarExportConfig {
  /** Choices offered for an event that spans several days; the first is preselected. */
  scopes: CalendarExportScope[];
  /** Offer "Add to calendar" in every event's details (any view), not only on the Day view. */
  onEveryEvent: boolean;
}

export interface VersionConfig {
  id: VersionId;
  name: string; // "Anniversary (TBC Classic)"
  shortName: string; // "Anniversary"
  status: 'live' | 'upcoming' | 'retired';
  /** Launches per part of the world; the earliest one makes an upcoming version live. */
  launches?: VersionLaunch[];
  /** One or two sentences shown on the upcoming-version screen. */
  summary?: string;
  regions: Region[];
  defaultRegionId: string;
  events: VersionEventBinding[];
  baseThemeId: ThemeId; // theme when no event is dominant
  /** The quiet day at the inn (Day view of a day with no events), per version. */
  quietDay?: QuietDayStyle;
  /** Shape/depth/motion tokens for this version (src/styles/version-styles.css); default classic. */
  uiStyle?: 'classic' | 'modern';
  calendarExport?: CalendarExportConfig;
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
  location?: string; // from a monthly rotation or an explicit date
  source?: string;
  note?: string;
  /** Estimated from the standard yearly or weekly schedule (shown as "Estimated"). */
  estimated?: 'yearly' | 'weekly';
}

/** Half-open instant range [start, end). */
export interface DateRange {
  start: Date;
  end: Date;
}
