import { z } from 'zod';
import type {
  ChecklistItem,
  EventDefinition,
  EventExperience,
  ExplicitOccurrence,
  Region,
  ScheduleFile,
  ScheduleRule,
  VersionConfig,
  VersionEventBinding,
} from './types';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a kebab-case slug');
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'must be local ISO "YYYY-MM-DDTHH:mm"');
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be "HH:mm"');
const weekday = z.union(
  [0, 1, 2, 3, 4, 5, 6].map((d) => z.literal(d)) as [
    z.ZodLiteral<0>,
    z.ZodLiteral<1>,
    z.ZodLiteral<2>,
    z.ZodLiteral<3>,
    z.ZodLiteral<4>,
    z.ZodLiteral<5>,
    z.ZodLiteral<6>,
  ],
);
const url = z.url();

const nth = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal('last')]);
const month = z.number().int().min(1).max(12);

export const annualAnchorSchema = z.discriminatedUnion('type', [
  z
    .strictObject({ type: z.literal('date'), month, day: z.number().int().min(1).max(31) })
    .refine(
      ({ month: m, day }) => day <= new Date(Date.UTC(2001, m, 0)).getUTCDate(),
      'no such day in that month',
    ),
  z.strictObject({ type: z.literal('weekday'), month, weekday, nth }),
  z.strictObject({ type: z.literal('easter'), offsetDays: z.number().int() }),
  z.strictObject({ type: z.literal('lunar-new-year'), offsetDays: z.number().int() }),
]);

export const annualScheduleSchema = z.strictObject({
  anchor: annualAnchorSchema,
  startTime: timeOfDay,
  durationDays: z.number().int().positive(),
  source: url,
});

export const rarities = ['weekly', 'monthly', 'seasonal', 'annual', 'once'] as const;
export const eventCategories = [
  'holiday',
  'faire',
  'fishing',
  'world',
  'pvp',
  'milestone',
] as const;

const levelRange = z
  .strictObject({ min: z.number().int().min(1), max: z.number().int().min(1).optional() })
  .refine((r) => r.max === undefined || r.max >= r.min, 'max must be ≥ min');

export const eventExperienceSchema = z
  .strictObject({
    xpBonus: z.string().min(1).optional(),
    levelRange: levelRange.optional(),
    quests: z
      .array(
        z.strictObject({
          name: z.string().min(1),
          level: levelRange.optional(),
          rewards: z.array(z.string().min(1)).min(1).optional(),
          notes: z.string().min(1).optional(),
        }),
      )
      .min(1)
      .optional(),
    rewards: z.array(z.string().min(1)).min(1).optional(),
    notes: z.string().min(1).optional(),
    source: url,
  })
  .refine(
    ({ source: _source, ...facts }) => Object.keys(facts).length > 0,
    'needs at least one fact besides source',
  );

export const checklistItemSchema = z.strictObject({
  id: slug,
  kind: z.enum(['quest', 'achievement', 'task']),
  name: z.string().min(1),
  source: url.optional(),
});

export const eventDefinitionSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  shortName: z.string().min(1).optional(),
  category: z.enum(eventCategories),
  rarity: z.enum(rarities),
  priority: z.number().int().optional(),
  themeId: slug,
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)).optional(),
  links: z.array(z.strictObject({ label: z.string().min(1), url })).optional(),
  experience: z.record(slug, eventExperienceSchema).optional(),
  checklist: z.record(slug, z.array(checklistItemSchema).min(1)).optional(),
  annual: annualScheduleSchema.optional(),
});

export const explicitOccurrenceSchema = z.strictObject({
  start: localDateTime,
  end: localDateTime,
  verified: z.boolean(),
  source: url.optional(),
  note: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
});

export const scheduleRuleSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('explicit'),
    occurrences: z.array(explicitOccurrenceSchema),
  }),
  z.strictObject({
    kind: z.literal('weekly'),
    weekday,
    startTime: timeOfDay,
    durationMinutes: z.number().int().positive(),
    verified: z.boolean(),
    source: url.optional(),
  }),
  z.strictObject({
    kind: z.literal('annual'),
    anchor: annualAnchorSchema,
    startTime: timeOfDay,
    durationDays: z.number().int().positive(),
    verified: z.boolean(),
    estimated: z.boolean().optional(),
    source: url.optional(),
    note: z.string().min(1).optional(),
    overrides: z.array(explicitOccurrenceSchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('monthly'),
    anchor: z.strictObject({ weekday, nth }),
    offsetDays: z.number().int().optional(),
    startTime: timeOfDay,
    durationDays: z.number().int().positive(),
    rotation: z.array(z.string().min(1)).min(1).optional(),
    rotationAnchor: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'must be "YYYY-MM"')
      .optional(),
    verified: z.boolean(),
    source: url.optional(),
  }),
]);

export const regionSchema = z.strictObject({
  id: slug,
  label: z.string().min(1),
  timeZone: z.string().min(1),
});

export const versionEventBindingSchema = z.strictObject({
  eventId: slug,
  rule: scheduleRuleSchema,
  regionRules: z.record(z.string(), scheduleRuleSchema).optional(),
  regions: z.array(z.string()).min(1).optional(),
  notes: z.string().min(1).optional(),
});

export const versionConfigSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  shortName: z.string().min(1),
  status: z.enum(['live', 'upcoming', 'retired']),
  launchDate: z.iso.datetime({ offset: true }).or(z.iso.date()).optional(),
  summary: z.string().min(1).optional(),
  regions: z.array(regionSchema).min(1),
  defaultRegionId: slug,
  events: z.array(versionEventBindingSchema),
  baseThemeId: slug,
  quietThemeId: slug.optional(),
  uiStyle: z.enum(['classic', 'modern']).optional(),
});

export const scheduleFileSchema = z.strictObject({
  year: z.number().int().min(2000).max(2100),
  notes: z.string().optional(),
  events: z.record(slug, z.array(explicitOccurrenceSchema)),
});

/* Compile-time guarantees that the schemas and the hand-written types stay in sync. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type SchemaTypeChecks = [
  Assert<Equals<z.infer<typeof eventDefinitionSchema>, EventDefinition>>,
  Assert<Equals<z.infer<typeof eventExperienceSchema>, EventExperience>>,
  Assert<Equals<z.infer<typeof checklistItemSchema>, ChecklistItem>>,
  Assert<Equals<z.infer<typeof explicitOccurrenceSchema>, ExplicitOccurrence>>,
  Assert<Equals<z.infer<typeof scheduleRuleSchema>, ScheduleRule>>,
  Assert<Equals<z.infer<typeof regionSchema>, Region>>,
  Assert<Equals<z.infer<typeof versionEventBindingSchema>, VersionEventBinding>>,
  Assert<Equals<z.infer<typeof versionConfigSchema>, VersionConfig>>,
  Assert<Equals<z.infer<typeof scheduleFileSchema>, ScheduleFile>>,
];
