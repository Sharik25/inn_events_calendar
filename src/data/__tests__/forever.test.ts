import { expandOccurrences } from '@/engine';
import { eventDefinitions } from '../events';
import { anniversary } from '../versions/anniversary/version';
import { forever } from '../versions/forever/version';
import { ESTIMATED_NOTE, ESTIMATED_WEEKLY_NOTE } from '../schedules';

const span = { start: new Date('2026-01-01T00:00Z'), end: new Date('2028-01-01T00:00Z') };
const occurrences = expandOccurrences(forever, 'global', span);
const ofEvent = (id: string) => occurrences.filter((o) => o.eventId === id);
const wall = (d: Date) =>
  d.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 16).replace(' ', 'T');

describe('WoW: Forever data', () => {
  it('has the four Darkmoon Faire visits from the game client, with their sites', () => {
    expect(
      ofEvent('darkmoon-faire').map((o) => [o.start.toISOString(), o.location, o.verified]),
    ).toEqual([
      ['2026-11-09T08:00:00.000Z', 'Elwynn Forest', false], // 00:00 PST
      ['2026-12-07T08:00:00.000Z', 'Mulgore (below Thunder Bluff)', false],
      ['2027-01-04T08:00:00.000Z', 'Elwynn Forest', false],
      ['2027-02-08T08:00:00.000Z', 'Mulgore (below Thunder Bluff)', false],
    ]);
    for (const o of ofEvent('darkmoon-faire')) {
      expect(o.estimated).toBeUndefined();
      expect(o.note).toMatch(/not announced by Blizzard.*time of day is assumed/);
    }
  });

  it('has every yearly holiday, each date estimated and saying so', () => {
    const yearly = eventDefinitions.filter((d) => d.annual).map((d) => d.id);
    expect(yearly).toHaveLength(11);
    for (const id of yearly) {
      expect(ofEvent(id).length, id).toBeGreaterThan(0);
      for (const o of ofEvent(id)) {
        expect(o.verified).toBe(false);
        expect(o.estimated).toBe('yearly');
        expect(o.note).toBe(ESTIMATED_NOTE);
      }
    }
  });

  it('leaves out holidays that ended before Forever launched', () => {
    // Hallow's End 2026 ended Nov 1; Forever launches Nov 4.
    expect(ofEvent('hallows-end').map((o) => wall(o.start))).toEqual(['2027-10-18T10:00']);
    expect(ofEvent('winter-veil').map((o) => wall(o.start))).toEqual([
      '2026-12-15T10:00',
      '2027-12-15T10:00',
    ]);
    expect(occurrences.every((o) => o.end > new Date('2026-11-04T23:00:00Z'))).toBe(true);
  });

  it('estimates 2027 holidays from the yearly rules', () => {
    expect(
      Object.fromEntries(
        [
          'lunar-festival',
          'love-is-in-the-air',
          'noblegarden',
          'childrens-week',
          'harvest-festival',
        ].map((id) => [id, ofEvent(id).map((o) => wall(o.start))]),
      ),
    ).toEqual({
      'lunar-festival': ['2027-02-05T10:00'], // Lunar New Year Feb 6, 2027
      'love-is-in-the-air': ['2027-02-08T10:00'],
      noblegarden: ['2027-03-29T10:00'], // Easter Mar 28, 2027
      'childrens-week': ['2027-04-26T10:00'],
      'harvest-festival': ['2027-09-20T10:00'],
    });
  });
});

describe('standard yearly schedule', () => {
  it('reproduces every standard-calendar date in the Anniversary data', () => {
    const rules = expandOccurrences(
      { ...forever, launchDate: undefined, regions: anniversary.regions, events: forever.events },
      'eu',
      span,
    );
    const hand = expandOccurrences(anniversary, 'eu', span).filter((o) =>
      eventDefinitions.some((d) => d.id === o.eventId && d.annual),
    );
    expect(hand.length).toBeGreaterThan(15);
    for (const o of hand) {
      const match = rules.find((r) => r.eventId === o.eventId && +r.start === +o.start);
      expect(match, `${o.eventId} ${o.start.toISOString()}`).toBeDefined();
      expect(+match!.end).toBe(+o.end);
    }
  });
});

describe('fishing', () => {
  it('Forever has the Sunday fishing contest from launch, same slot as Anniversary, estimated', () => {
    const fishing = ofEvent('stv-fishing');
    expect(wall(fishing[0]!.start)).toBe('2026-11-08T14:00'); // first Sunday after launch
    for (const o of fishing) {
      expect(new Date(wall(o.start) + 'Z').getUTCDay()).toBe(0);
      expect(wall(o.start).slice(11)).toBe('14:00');
      expect(o.end.getTime() - o.start.getTime()).toBe(120 * 60_000);
      expect(o.verified).toBe(false);
      expect(o.estimated).toBe('weekly');
      expect(o.note).toBe(ESTIMATED_WEEKLY_NOTE);
    }
    // Every Sunday from Nov 8, 2026 through 2027.
    expect(fishing).toHaveLength(60);
  });

  it('Anniversary keeps its confirmed Sunday 14:00-16:00 contest', () => {
    const anniv = expandOccurrences(anniversary, 'us', span).filter(
      (o) => o.eventId === 'stv-fishing',
    );
    expect(anniv).toHaveLength(104);
    for (const o of anniv) {
      expect(o.verified).toBe(true);
      expect(o.estimated).toBeUndefined();
      expect(wall(o.start).slice(11)).toBe('14:00');
      expect(o.end.getTime() - o.start.getTime()).toBe(120 * 60_000);
    }
  });
});
