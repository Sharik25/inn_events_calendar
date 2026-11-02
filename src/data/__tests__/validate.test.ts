import type { EventDefinition, VersionConfig } from '@/domain/types';
import { eventDefinitions } from '../events';
import { versions } from '../versions';
import { themeIds } from '@/themes';
import { validateData } from '../validate';

const event: EventDefinition = {
  id: 'test-event',
  name: 'Test',
  category: 'holiday',
  rarity: 'annual',
  themeId: 'base',
  summary: 'A test event.',
};

const version: VersionConfig = {
  id: 'test',
  name: 'Test version',
  shortName: 'Test',
  status: 'live',
  regions: [{ id: 'eu', label: 'Europe', timeZone: 'Europe/Paris' }],
  defaultRegionId: 'eu',
  baseThemeId: 'base',
  events: [
    {
      eventId: 'test-event',
      rule: {
        kind: 'explicit',
        occurrences: [{ start: '2026-10-18T10:00', end: '2026-11-01T10:00', verified: false }],
      },
    },
  ],
};

const valid = { events: [event], versions: [version], themeIds: ['base'] };

describe('bundled data', () => {
  it('passes validation', () => {
    expect(validateData({ events: eventDefinitions, versions, themeIds })).toEqual([]);
  });

  it('marks every unverified explicit date with a note explaining why', () => {
    for (const v of versions) {
      for (const b of v.events) {
        if (b.rule.kind !== 'explicit') continue;
        for (const o of b.rule.occurrences) {
          if (!o.verified) expect(o.note, `${v.id}/${b.eventId} ${o.start}`).toBeTruthy();
        }
      }
    }
  });
});

describe('validateData', () => {
  it('accepts a minimal valid data set', () => {
    expect(validateData(valid)).toEqual([]);
  });

  it('reports schema errors, unknown themes and duplicate ids', () => {
    const bad = { ...event, id: 'Not A Slug', themeId: 'nope' };
    const issues = validateData({ ...valid, events: [event, event, bad] });
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Not A Slug.*kebab-case/),
        expect.stringMatching(/unknown themeId "nope"/),
        'duplicate event id "test-event"',
      ]),
    );
  });

  it('checks experience data: known version, at least one fact, sane levels', () => {
    const source = 'https://example.com/quest';
    const withXp = (experience: EventDefinition['experience']) => ({ ...event, experience });
    expect(
      validateData({
        ...valid,
        events: [
          withXp({ test: { quests: [{ name: 'Q', level: { min: 10, max: 20 } }], source } }),
        ],
      }),
    ).toEqual([]);
    const issues = validateData({
      ...valid,
      events: [
        withXp({ retail: { notes: 'x', source } }),
        { ...withXp({ test: { source } }), id: 'empty' },
        { ...withXp({ test: { levelRange: { min: 30, max: 20 }, source } }), id: 'levels' },
      ],
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        'event "test-event": experience for unknown version "retail"',
        expect.stringMatching(/"empty".*at least one fact/),
        expect.stringMatching(/"levels".*max must be ≥ min/),
      ]),
    );
  });

  it('reports version-level reference errors', () => {
    const issues = validateData({
      ...valid,
      versions: [
        {
          ...version,
          baseThemeId: 'missing',
          defaultRegionId: 'us',
          regions: [...version.regions, ...version.regions],
          events: [
            ...version.events,
            { eventId: 'ghost', rule: version.events[0]!.rule },
            {
              eventId: 'test-event',
              rule: version.events[0]!.rule,
              regionRules: { oce: version.events[0]!.rule },
            },
          ],
        },
        version,
      ],
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        'duplicate version id "test"',
        'version "test": unknown baseThemeId "missing"',
        'version "test": duplicate region "eu"',
        'version "test": defaultRegionId "us" is not a region',
        'version "test": event "test-event" is bound more than once',
        'version "test" event "ghost": not in the event catalog',
        'version "test" event "test-event": regionRules for unknown region "oce"',
      ]),
    );
  });

  it('reports invalid time zones and schema errors in versions', () => {
    const tz = validateData({
      ...valid,
      versions: [{ ...version, regions: [{ id: 'eu', label: 'EU', timeZone: 'Mars/Olympus' }] }],
    });
    expect(tz).toEqual(['version "test": region "eu" has invalid time zone "Mars/Olympus"']);

    const schema = validateData({
      ...valid,
      versions: [{ ...version, status: 'paused' as VersionConfig['status'] }],
    });
    expect(schema[0]).toMatch(/^version "test": status/);
  });

  it('reports occurrences that end before they start or overlap', () => {
    const issues = validateData({
      ...valid,
      versions: [
        {
          ...version,
          events: [
            {
              eventId: 'test-event',
              rule: {
                kind: 'explicit',
                occurrences: [
                  { start: '2026-10-18T10:00', end: '2026-10-25T10:00', verified: false },
                  { start: '2026-10-20T10:00', end: '2026-10-30T10:00', verified: false },
                  { start: '2026-12-02T10:00', end: '2026-12-01T10:00', verified: false },
                ],
              },
              regionRules: {
                eu: {
                  kind: 'monthly',
                  anchor: { weekday: 5, nth: 1 },
                  startTime: '00:00',
                  durationDays: 7,
                  rotationAnchor: '2026-01',
                  verified: false,
                },
              },
            },
          ],
        },
      ],
    });
    expect(issues).toEqual([
      'version "test" event "test-event" [eu]: occurrence 2026-12-02T10:00 ends before it starts',
      'version "test" event "test-event" [eu]: occurrences 2026-10-18T10:00 and 2026-10-20T10:00 overlap',
      'version "test" event "test-event" [eu override]: rotationAnchor without rotation',
    ]);
  });

  it('requires a rotation anchor when a monthly rule rotates locations', () => {
    const issues = validateData({
      ...valid,
      versions: [
        {
          ...version,
          events: [
            {
              eventId: 'test-event',
              rule: {
                kind: 'monthly',
                anchor: { weekday: 5, nth: 1 },
                startTime: '00:00',
                durationDays: 7,
                rotation: ['A', 'B'],
                verified: false,
              },
            },
          ],
        },
      ],
    });
    expect(issues).toEqual([
      'version "test" event "test-event" [eu]: rotation without rotationAnchor',
    ]);
  });
});
