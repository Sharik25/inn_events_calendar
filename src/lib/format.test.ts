import {
  dayParts,
  formatDateSpan,
  formatDayLong,
  formatMonth,
  weekdayShort,
  formatDateTime,
  formatDay,
  formatDistance,
  formatDuration,
  formatRange,
  formatTime,
  zoneLabel,
} from './format';

describe('format', () => {
  it('splits a calendar date for the numeral, independent of zones', () => {
    expect(dayParts('2026-10-27')).toEqual({
      weekday: 'Tuesday',
      day: 27,
      month: 'October',
      year: 2026,
    });
    expect(formatDay('2026-11-01')).toBe('Sun, Nov 1');
  });

  it('formats calendar labels', () => {
    expect(formatDayLong('2026-11-15')).toBe('Sunday, November 15');
    expect(weekdayShort('2026-10-26')).toBe('Mon');
    expect(formatMonth('2026-10')).toBe('October 2026');
    expect(formatDateSpan('2026-10-26', '2026-11-01')).toBe('Oct 26 – Nov 1, 2026');
    expect(formatDateSpan('2026-12-28', '2027-01-03')).toBe('Dec 28, 2026 – Jan 3, 2027');
  });

  it('formats instants in a zone with 24-hour times', () => {
    const t = new Date('2026-10-25T13:00:00Z');
    expect(formatTime(t, 'Europe/Paris')).toBe('14:00');
    expect(formatTime(t, 'America/Los_Angeles')).toBe('06:00');
    expect(formatDateTime(t, 'Europe/Paris')).toBe('Sun, Oct 25, 14:00');
  });

  it('formats ranges on one day and across days', () => {
    const start = new Date('2026-10-25T13:00:00Z');
    // A moment (≤ 1 min), like the weekly reset, is a single time.
    expect(formatRange(start, new Date(start.getTime() + 60_000), 'Europe/Paris')).toBe(
      formatDateTime(start, 'Europe/Paris'),
    );
    expect(formatRange(start, new Date('2026-10-25T15:00:00Z'), 'Europe/Paris')).toBe(
      'Sun, Oct 25, 14:00–16:00',
    );
    expect(
      formatRange(
        new Date('2026-10-18T08:00:00Z'),
        new Date('2026-11-01T09:00:00Z'),
        'Europe/Paris',
      ),
    ).toBe('Sun, Oct 18, 10:00 – Sun, Nov 1, 10:00');
  });

  it('labels zones', () => {
    expect(zoneLabel(new Date('2026-01-15T12:00:00Z'), 'Europe/Paris')).toBe('GMT+1');
    expect(zoneLabel(new Date('2026-01-15T12:00:00Z'), 'America/Los_Angeles')).toBe('PST');
  });

  it('formats durations and distances', () => {
    const m = 60_000;
    const h = 60 * m;
    const d = 24 * h;
    expect(formatDuration(4 * d + 22 * h + 5 * m)).toBe('4d 22h');
    expect(formatDuration(2 * d)).toBe('2d');
    expect(formatDuration(3 * h + 12 * m)).toBe('3h 12m');
    expect(formatDuration(3 * h)).toBe('3h');
    expect(formatDuration(12 * m + 30_000)).toBe('12m');
    expect(formatDuration(30_000)).toBe('<1m');
    expect(formatDuration(-5)).toBe('<1m');
    expect(formatDistance(6 * d + 5 * h)).toBe('6d');
    expect(formatDistance(5 * h + 59 * m)).toBe('5h');
    expect(formatDistance(30 * m)).toBe('<1h');
  });
});
