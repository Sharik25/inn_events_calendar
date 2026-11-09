import sample from './__fixtures__/wowhead-holidays.sample.json';
import {
  checkAgainstPrevious,
  normalizeFeed,
  rawFeedSchema,
  serializeSnapshot,
  toUtc,
  verifySourceTimeZone,
  type RawEntry,
} from './wowhead';

/**
 * The fixture has the documented shape of `g_listviews.holidays.data`. Its Nov 2026 values are
 * what Wowhead's Forever pages showed on Nov 9, 2026 (Call to Arms 07:00, Darkmoon Faire Nov 9);
 * the March 2027 week, the old-series week and the placeholder times are made up to exercise DST
 * and the merge rules. TODO: replace with a trimmed copy of a real export.
 */
const feed = rawFeedSchema.parse(sample);
const clone = (): RawEntry[] => structuredClone(feed);

describe('toUtc', () => {
  it('reads the feed’s wall-clock times as US Pacific, DST included', () => {
    expect(toUtc('2026/11/03 07:00:00')).toBe('2026-11-03T15:00:00Z'); // PST, UTC−8
    expect(toUtc('2026/06/01 08:00:00')).toBe('2026-06-01T15:00:00Z'); // PDT, UTC−7
    // Around the November change (Nov 1, 2026) and the March change (Mar 14, 2027).
    expect(toUtc('2026/10/31 00:00:00')).toBe('2026-10-31T07:00:00Z');
    expect(toUtc('2026/11/02 00:00:00')).toBe('2026-11-02T08:00:00Z');
    expect(toUtc('2027/03/13 12:00:00')).toBe('2027-03-13T20:00:00Z');
    expect(toUtc('2027/03/15 12:00:00')).toBe('2027-03-15T19:00:00Z');
  });
});

describe('verifySourceTimeZone', () => {
  it('passes when every weekly Call to Arms starts Tuesday 15:00 UTC on both sides of DST', () => {
    expect(() => verifySourceTimeZone(feed)).not.toThrow();
  });

  it('fails for a zone that puts them elsewhere (e.g. read as Paris time)', () => {
    expect(() => verifySourceTimeZone(feed, 'Europe/Paris')).toThrow(/not Tuesday 15:00 UTC/);
  });

  it('fails when the feed’s summer times don’t move with US DST (a fixed offset)', () => {
    const fixed = clone();
    fixed[0]!.occurrences[0] = { start: '2027/03/16 07:00:00', end: '2027/03/23 07:00:00' };
    expect(() => verifySourceTimeZone(fixed)).toThrow(/2027-03-16T14:00/);
  });

  it('is inconclusive (and fails) without starts on both sides of a DST change', () => {
    const winterOnly = clone();
    winterOnly[0]!.occurrences = winterOnly[0]!.occurrences.slice(1);
    expect(() => verifySourceTimeZone(winterOnly)).toThrow(/inconclusive/);
  });
});

describe('normalizeFeed', () => {
  const snapshot = normalizeFeed(feed, {});

  it('keeps Wowhead’s id, converts to UTC, dedupes and sorts', () => {
    expect(snapshot.events.map((e) => e.sourceId)).toEqual([263, 285, 1840, 1841, 1842]);
    expect(snapshot.events.find((e) => e.sourceId === 1841)?.occurrences).toEqual([
      { start: '2026-11-03T15:00:00Z', end: '2026-11-10T15:00:00Z' },
      { start: '2027-03-16T15:00:00Z', end: '2027-03-23T15:00:00Z' },
    ]);
    expect(snapshot.events.find((e) => e.sourceId === 1842)?.occurrences).toHaveLength(1);
    expect(snapshot.events.find((e) => e.sourceId === 285)).toMatchObject({
      name: 'Call to Arms: Arathi Basin',
      durationHours: 100,
    });
  });

  it('lists named events without dates apart, and never imports a "[#id]" placeholder', () => {
    expect(snapshot.withoutDates).toEqual([{ sourceId: 324, name: "Hallow's End" }]);
    expect(snapshot.unresolved).toEqual([
      { sourceId: 1, occurrences: 0 },
      { sourceId: 1896, occurrences: 1 },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain('[#');
  });

  it('takes a placeholder’s name from the names file once resolved', () => {
    const resolved = normalizeFeed(feed, { '1896': 'Resolved Name' });
    expect(resolved.events.find((e) => e.sourceId === 1896)).toMatchObject({
      name: 'Resolved Name',
      occurrences: [{ start: '2026-11-01T07:00:00Z', end: '2026-11-30T08:00:00Z' }],
    });
    expect(resolved.unresolved).toEqual([{ sourceId: 1, occurrences: 0 }]);
  });

  it('gives the same bytes for the same data, whatever the order (a rerun is no diff)', () => {
    const shuffled = clone().reverse();
    shuffled.forEach((e) => e.occurrences.reverse());
    expect(serializeSnapshot(normalizeFeed(shuffled, {}))).toBe(serializeSnapshot(snapshot));
    expect(serializeSnapshot(snapshot).endsWith('}\n')).toBe(true);
  });

  it('rejects a changed shape', () => {
    expect(() => rawFeedSchema.parse([])).toThrow(/no entries/);
    expect(() =>
      rawFeedSchema.parse([{ id: 1, name: 'x', occurrences: [{ start: '2026-11-03T07:00' }] }]),
    ).toThrow();
  });
});

describe('checkAgainstPrevious', () => {
  const good = normalizeFeed(feed, {});

  it('accepts a first snapshot and small changes', () => {
    expect(() => checkAgainstPrevious(good, undefined)).not.toThrow();
    const smaller = { ...good, events: good.events.slice(1) };
    expect(() => checkAgainstPrevious(smaller, good)).not.toThrow(); // 5 → 4 events
  });

  it('never replaces good data with an empty or sharply smaller snapshot', () => {
    expect(() => checkAgainstPrevious({ ...good, events: [] }, good)).toThrow(/no dated events/);
    const sharp = { ...good, events: good.events.slice(0, 2) };
    expect(() => checkAgainstPrevious(sharp, good)).toThrow(/Sharp drop in events: 5 → 2/);
  });
});
