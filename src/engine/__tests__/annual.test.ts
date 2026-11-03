import type { ScheduleRule } from '@/domain/types';
import { annualStartDate, easterSunday, LUNAR_NEW_YEAR } from '../rules/annual';
import { expandRule } from '../rules';

const range = (a: string, b: string) => ({ start: new Date(a), end: new Date(b) });

describe('annual anchors', () => {
  it('computes Western Easter', () => {
    expect(easterSunday(2024)).toBe('2024-03-31');
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
    expect(easterSunday(2038)).toBe('2038-04-25'); // latest possible date
  });

  it('finds the start day for each anchor type', () => {
    expect(annualStartDate({ type: 'date', month: 10, day: 18 }, 2027)).toBe('2027-10-18');
    expect(annualStartDate({ type: 'weekday', month: 2, weekday: 1, nth: 2 }, 2026)).toBe(
      '2026-02-09',
    );
    expect(annualStartDate({ type: 'weekday', month: 4, weekday: 1, nth: 'last' }, 2026)).toBe(
      '2026-04-27',
    );
    expect(annualStartDate({ type: 'easter', offsetDays: 1 }, 2026)).toBe('2026-04-06');
    expect(annualStartDate({ type: 'lunar-new-year', offsetDays: -1 }, 2026)).toBe('2026-02-16');
  });

  it('has no estimate where the Lunar New Year table ends', () => {
    expect(LUNAR_NEW_YEAR[2031]).toBeUndefined();
    expect(annualStartDate({ type: 'lunar-new-year', offsetDays: -1 }, 2031)).toBeNull();
  });
});

describe('annual rule', () => {
  const rule: ScheduleRule = {
    kind: 'annual',
    anchor: { type: 'date', month: 12, day: 15 },
    startTime: '10:00',
    durationDays: 18,
    verified: false,
    estimated: true,
    source: 'https://example.com/standard',
    note: 'estimated',
    overrides: [
      {
        start: '2027-12-16T10:00',
        end: '2028-01-02T10:00',
        verified: true,
        source: 'https://example.com/real',
      },
    ],
  };

  it('estimates each year, crossing New Year, on the server wall clock', () => {
    const [veil] = expandRule(rule, {
      timeZone: 'Europe/Paris',
      range: range('2027-01-01T00:00Z', '2027-01-02T00:00Z'),
    });
    expect(veil).toEqual({
      start: new Date('2026-12-15T09:00:00Z'),
      end: new Date('2027-01-02T09:00:00Z'),
      verified: false,
      estimated: 'yearly',
      source: 'https://example.com/standard',
      note: 'estimated',
    });
  });

  it('uses a real date instead of the estimate in its year', () => {
    const [real] = expandRule(rule, {
      timeZone: 'Europe/Paris',
      range: range('2027-12-20T00:00Z', '2027-12-21T00:00Z'),
    });
    expect(real).toEqual({
      start: new Date('2027-12-16T09:00:00Z'),
      end: new Date('2028-01-02T09:00:00Z'),
      verified: true,
      source: 'https://example.com/real',
    });
  });

  it('skips years it cannot derive', () => {
    const lunar: ScheduleRule = {
      kind: 'annual',
      anchor: { type: 'lunar-new-year', offsetDays: -1 },
      startTime: '10:00',
      durationDays: 14,
      verified: false,
    };
    expect(
      expandRule(lunar, {
        timeZone: 'UTC',
        range: range('2031-01-01T00:00Z', '2032-01-01T00:00Z'),
      }),
    ).toEqual([]);
  });
});
