import {
  addDays,
  addMonths,
  dayRange,
  daysBetween,
  daysRange,
  guessRegionId,
  intersects,
  isValidTimeZone,
  localDateOf,
  localTimeOf,
  monthOf,
  monthRange,
  monthsBetween,
  nthWeekdayOfMonth,
  wallTimeToInstant,
  weekdayOf,
} from '../time';

const iso = (d: Date) => d.toISOString();
const hours = (r: { start: Date; end: Date }) => (r.end.getTime() - r.start.getTime()) / 3_600_000;

describe('wallTimeToInstant / localDateOf / localTimeOf', () => {
  it('converts server wall time using the zone offset in effect on that date', () => {
    expect(iso(wallTimeToInstant('2026-01-15T10:00', 'Europe/Paris'))).toBe(
      '2026-01-15T09:00:00.000Z',
    );
    expect(iso(wallTimeToInstant('2026-07-15T10:00', 'Europe/Paris'))).toBe(
      '2026-07-15T08:00:00.000Z',
    );
    expect(iso(wallTimeToInstant('2026-01-15T10:00', 'America/Los_Angeles'))).toBe(
      '2026-01-15T18:00:00.000Z',
    );
    expect(iso(wallTimeToInstant('2026-07-15T10:00', 'America/Los_Angeles'))).toBe(
      '2026-07-15T17:00:00.000Z',
    );
  });

  it('throws on malformed input', () => {
    expect(() => wallTimeToInstant('not a date', 'Europe/Paris')).toThrow(/Invalid wall time/);
  });

  it('reads the calendar date and time in a zone', () => {
    const instant = new Date('2026-10-31T23:30:00Z');
    expect(localDateOf(instant, 'Europe/Paris')).toBe('2026-11-01');
    expect(localDateOf(instant, 'America/Los_Angeles')).toBe('2026-10-31');
    expect(localTimeOf(instant, 'Asia/Jerusalem')).toBe('01:30');
  });
});

describe('calendar date arithmetic', () => {
  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-18', '2026-11-01')).toBe(14);
    expect(daysBetween('2026-11-01', '2026-10-18')).toBe(-14);
  });

  it('knows weekdays', () => {
    expect(weekdayOf('2026-10-27')).toBe(2); // Tuesday
    expect(weekdayOf('2026-11-01')).toBe(0); // Sunday
  });

  it('rejects malformed dates', () => {
    expect(() => addDays('2026/10/27', 1)).toThrow(/Invalid local date/);
  });

  it('does month arithmetic across years', () => {
    expect(monthOf('2026-10-27')).toBe('2026-10');
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(monthsBetween('2026-01', '2026-10')).toBe(9);
    expect(monthsBetween('2026-01', '2025-12')).toBe(-1);
  });

  it('finds the nth and last weekday of a month', () => {
    expect(nthWeekdayOfMonth('2026-11', 5, 1)).toBe('2026-11-06'); // 1st Friday
    expect(nthWeekdayOfMonth('2026-10', 5, 1)).toBe('2026-10-02');
    expect(nthWeekdayOfMonth('2026-02', 1, 2)).toBe('2026-02-09'); // 2nd Monday
    expect(nthWeekdayOfMonth('2026-11', 0, 1)).toBe('2026-11-01'); // month starts on it
    expect(nthWeekdayOfMonth('2026-10', 0, 'last')).toBe('2026-10-25');
    expect(nthWeekdayOfMonth('2026-10', 6, 'last')).toBe('2026-10-31'); // month ends on it
    expect(nthWeekdayOfMonth('2028-02', 2, 'last')).toBe('2028-02-29');
  });
});

describe('day ranges and DST', () => {
  it('EU spring-forward and fall-back days last 23h and 25h', () => {
    expect(hours(dayRange('2026-03-29', 'Europe/Paris'))).toBe(23);
    expect(hours(dayRange('2026-10-25', 'Europe/Paris'))).toBe(25);
    expect(hours(dayRange('2026-10-27', 'Europe/Paris'))).toBe(24);
  });

  it('US spring-forward and fall-back days last 23h and 25h', () => {
    expect(hours(dayRange('2026-03-08', 'America/Los_Angeles'))).toBe(23);
    expect(hours(dayRange('2026-11-01', 'America/Los_Angeles'))).toBe(25);
  });

  it('starts the day at local midnight', () => {
    const r = dayRange('2026-10-27', 'Asia/Jerusalem');
    expect(iso(r.start)).toBe('2026-10-26T22:00:00.000Z');
    expect(iso(r.end)).toBe('2026-10-27T22:00:00.000Z');
  });

  it('spans several days', () => {
    const r = daysRange('2026-10-26', '2026-11-01', 'Europe/Paris');
    expect(iso(r.start)).toBe('2026-10-25T23:00:00.000Z');
    expect(iso(r.end)).toBe('2026-11-01T23:00:00.000Z');
  });
});

describe('monthRange', () => {
  it('covers the whole month in the given zone, across a DST switch', () => {
    const nov = monthRange('2026-11', 'America/Los_Angeles');
    expect(iso(nov.start)).toBe('2026-11-01T07:00:00.000Z');
    expect(iso(nov.end)).toBe('2026-12-01T08:00:00.000Z');
    expect(hours(nov)).toBe(30 * 24 + 1);
  });

  it('rolls over the year', () => {
    expect(iso(monthRange('2026-12', 'UTC').end)).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('intersects', () => {
  const a = { start: new Date('2026-10-01T00:00Z'), end: new Date('2026-10-02T00:00Z') };

  it('treats ranges as half-open', () => {
    expect(
      intersects(a, { start: new Date('2026-10-02T00:00Z'), end: new Date('2026-10-03T00:00Z') }),
    ).toBe(false);
    expect(
      intersects(a, { start: new Date('2026-09-30T00:00Z'), end: new Date('2026-10-01T00:00Z') }),
    ).toBe(false);
  });

  it('detects partial and full overlap', () => {
    expect(
      intersects(a, { start: new Date('2026-10-01T23:59Z'), end: new Date('2026-10-05T00:00Z') }),
    ).toBe(true);
    expect(
      intersects(a, { start: new Date('2026-09-01T00:00Z'), end: new Date('2026-11-01T00:00Z') }),
    ).toBe(true);
  });
});

describe('time zone helpers', () => {
  it('validates IANA zones', () => {
    expect(isValidTimeZone('Europe/Paris')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });

  const usEu = [
    { id: 'us', label: 'Americas', timeZone: 'America/Los_Angeles' },
    { id: 'eu', label: 'Europe', timeZone: 'Europe/Paris' },
  ];

  it('guesses a region from the user time zone', () => {
    expect(guessRegionId('Asia/Jerusalem', usEu, 'us')).toBe('eu');
    expect(guessRegionId('Europe/Berlin', usEu, 'us')).toBe('eu');
    expect(guessRegionId('America/New_York', usEu, 'eu')).toBe('us');
    expect(guessRegionId('America/Argentina/Buenos_Aires', usEu, 'eu')).toBe('us');
  });

  it('prefers OCE when available and falls back otherwise', () => {
    const withOce = [...usEu, { id: 'oce', label: 'Oceania', timeZone: 'Australia/Sydney' }];
    expect(guessRegionId('Australia/Sydney', withOce, 'eu')).toBe('oce');
    expect(guessRegionId('Australia/Sydney', usEu, 'eu')).toBe('us');
  });

  it('uses the default for unknown areas', () => {
    expect(guessRegionId('UTC', usEu, 'eu')).toBe('eu');
    expect(guessRegionId('Etc/GMT+3', usEu, 'us')).toBe('us');
    expect(guessRegionId('', usEu, 'us')).toBe('us');
  });
});
