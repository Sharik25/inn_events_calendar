import type { DateRange, ScheduleRule } from '@/domain/types';
import { expandRule, ruleExpanders } from '../rules';

const range = (start: string, end: string): DateRange => ({
  start: new Date(start),
  end: new Date(end),
});
const starts = (os: { start: Date }[]) => os.map((o) => o.start.toISOString());

describe('explicit rule', () => {
  const rule: ScheduleRule = {
    kind: 'explicit',
    occurrences: [
      {
        start: '2026-10-18T10:00',
        end: '2026-11-01T10:00',
        verified: true,
        source: 'https://example.com/a',
        note: 'n',
        location: 'Elwynn Forest',
      },
      { start: '2027-10-18T10:00', end: '2027-11-01T10:00', verified: false },
    ],
  };

  it('converts server time to instants and keeps metadata', () => {
    const [o] = expandRule(rule, {
      timeZone: 'Europe/Paris',
      range: range('2026-10-27T00:00Z', '2026-10-28T00:00Z'),
    });
    expect(o).toEqual({
      start: new Date('2026-10-18T08:00:00Z'), // CEST
      end: new Date('2026-11-01T09:00:00Z'), // CET: after the Oct 25 switch
      verified: true,
      source: 'https://example.com/a',
      note: 'n',
      location: 'Elwynn Forest',
    });
  });

  it('filters to the range and omits empty metadata', () => {
    const result = expandRule(rule, {
      timeZone: 'Europe/Paris',
      range: range('2027-01-01T00:00Z', '2028-01-01T00:00Z'),
    });
    expect(result).toEqual([
      {
        start: new Date('2027-10-18T08:00:00Z'),
        end: new Date('2027-11-01T09:00:00Z'),
        verified: false,
      },
    ]);
  });
});

describe('moment rule', () => {
  const rule: ScheduleRule = {
    kind: 'moment',
    at: '2026-11-05T00:00:00+01:00',
    durationMinutes: 1,
    verified: true,
    source: 'https://example.com/launch',
  };

  it('is the same instant in every time zone', () => {
    for (const timeZone of ['America/Los_Angeles', 'Europe/Paris', 'Australia/Sydney']) {
      const [o, ...rest] = expandRule(rule, {
        timeZone,
        range: range('2026-11-01T00:00Z', '2026-11-10T00:00Z'),
      });
      expect(rest).toEqual([]);
      expect(o).toEqual({
        start: new Date('2026-11-04T23:00:00Z'),
        end: new Date('2026-11-04T23:01:00Z'),
        verified: true,
        source: 'https://example.com/launch',
      });
    }
  });

  it('is left out when outside the range', () => {
    const ctx = { timeZone: 'UTC', range: range('2026-11-05T00:00Z', '2026-11-06T00:00Z') };
    expect(expandRule(rule, ctx)).toEqual([]);
  });
});

describe('weekly rule', () => {
  const fishing: ScheduleRule = {
    kind: 'weekly',
    weekday: 0,
    startTime: '14:00',
    durationMinutes: 120,
    verified: true,
    source: 'https://example.com/fish',
  };

  it('keeps server wall time across the US DST switch', () => {
    const result = expandRule(fishing, {
      timeZone: 'America/Los_Angeles',
      range: range('2026-10-20T00:00Z', '2026-11-10T00:00Z'),
    });
    expect(starts(result)).toEqual([
      '2026-10-25T21:00:00.000Z', // PDT
      '2026-11-01T22:00:00.000Z', // PST: switch happened that morning
      '2026-11-08T22:00:00.000Z',
    ]);
    expect(result[0]).toMatchObject({ verified: true, source: 'https://example.com/fish' });
    expect(result[0]!.end.toISOString()).toBe('2026-10-25T23:00:00.000Z');
  });

  it('keeps server wall time across the EU DST switch', () => {
    const result = expandRule(fishing, {
      timeZone: 'Europe/Paris',
      range: range('2026-03-20T00:00Z', '2026-03-30T00:00Z'),
    });
    expect(starts(result)).toEqual(['2026-03-22T13:00:00.000Z', '2026-03-29T12:00:00.000Z']);
  });

  it('includes an occurrence already running at the range start, excludes one starting at its end', () => {
    const result = expandRule(fishing, {
      timeZone: 'Europe/Paris',
      range: range('2026-10-25T14:30Z', '2026-11-01T13:00Z'),
    });
    expect(starts(result)).toEqual(['2026-10-25T13:00:00.000Z']);
  });

  it('omits source when the rule has none', () => {
    const { source: _source, ...noSource } = fishing as Extract<ScheduleRule, { kind: 'weekly' }>;
    const [o] = ruleExpanders.weekly(noSource, {
      timeZone: 'Europe/Paris',
      range: range('2026-10-25T00:00Z', '2026-10-26T00:00Z'),
    });
    expect(o).not.toHaveProperty('source');
  });
});

describe('monthly rule', () => {
  const faire: Extract<ScheduleRule, { kind: 'monthly' }> = {
    kind: 'monthly',
    anchor: { weekday: 5, nth: 1 }, // first Friday
    offsetDays: 3, // → Monday
    startTime: '00:00',
    durationDays: 7,
    verified: false,
    source: 'https://example.com/dmf',
  };

  it('opens the Monday after the first Friday for a week', () => {
    const result = ruleExpanders.monthly(faire, {
      timeZone: 'Europe/Paris',
      range: range('2026-10-01T00:00Z', '2026-12-01T00:00Z'),
    });
    expect(result.map((o) => [o.start.toISOString(), o.end.toISOString()])).toEqual([
      ['2026-10-04T22:00:00.000Z', '2026-10-11T22:00:00.000Z'], // Mon Oct 5 – Mon Oct 12 (CEST)
      ['2026-11-08T23:00:00.000Z', '2026-11-15T23:00:00.000Z'], // Mon Nov 9 – Mon Nov 16 (CET)
    ]);
    expect(result[0]).toMatchObject({ verified: false, source: 'https://example.com/dmf' });
    expect(result[0]).not.toHaveProperty('location');
  });

  it('adds days on the wall clock across DST, with a negative offset', () => {
    const [o] = ruleExpanders.monthly(
      { ...faire, anchor: { weekday: 0, nth: 'last' }, offsetDays: -2, startTime: '10:00' },
      { timeZone: 'Europe/Paris', range: range('2026-10-24T00:00Z', '2026-10-25T00:00Z') },
    );
    // Fri Oct 23 10:00 CEST → Fri Oct 30 10:00 CET: 7 days + 1 hour of absolute time.
    expect(o!.start.toISOString()).toBe('2026-10-23T08:00:00.000Z');
    expect(o!.end.toISOString()).toBe('2026-10-30T09:00:00.000Z');
  });

  it('finds an occurrence anchored in the previous month (month boundary)', () => {
    const lastMonday = {
      ...faire,
      anchor: { weekday: 1, nth: 'last' } as const,
      offsetDays: undefined,
    };
    const result = ruleExpanders.monthly(lastMonday, {
      timeZone: 'Europe/Paris',
      range: range('2026-12-03T00:00Z', '2026-12-04T00:00Z'),
    });
    expect(starts(result)).toEqual(['2026-11-29T23:00:00.000Z']); // Mon Nov 30 → Dec 7
  });

  it('rotates locations by month from the anchor, including before it', () => {
    const rotating = {
      ...faire,
      rotation: ['Elwynn', 'Mulgore', 'Terokkar'],
      rotationAnchor: '2026-01',
    };
    const result = ruleExpanders.monthly(rotating, {
      timeZone: 'Europe/Paris',
      range: range('2025-12-01T00:00Z', '2027-01-01T00:00Z'),
    });
    const byMonth = Object.fromEntries(
      result.map((o) => [o.start.toISOString().slice(0, 7), o.location]),
    );
    expect(byMonth['2025-12']).toBe('Terokkar');
    expect(byMonth['2026-01']).toBe('Elwynn');
    expect(byMonth['2026-10']).toBe('Elwynn');
    expect(byMonth['2026-11']).toBe('Mulgore');
    expect(byMonth['2026-12']).toBe('Terokkar');
  });

  it('without a rotation anchor uses the first location', () => {
    const [o] = ruleExpanders.monthly(
      { ...faire, rotation: ['Elwynn', 'Mulgore'], source: undefined },
      { timeZone: 'Europe/Paris', range: range('2026-11-10T00:00Z', '2026-11-11T00:00Z') },
    );
    expect(o).toMatchObject({ location: 'Elwynn' });
    expect(o).not.toHaveProperty('source');
  });
});
