import { buildFeeds, expandOccurrences } from '@/engine';
import { eventDefinitions } from '../events';
import { anniversary } from '../versions/anniversary/version';
import { forever } from '../versions/forever/version';
import { launchBindings, launchEvents } from '../launches';
import { ESTIMATED_NOTE, ESTIMATED_WEEKLY_NOTE } from '../schedules';
import { FOREVER_LAUNCHES } from '../versions/forever/launches';

const span = { start: new Date('2026-01-01T00:00Z'), end: new Date('2028-01-01T00:00Z') };
const occurrences = expandOccurrences(forever, 'global', span);
const ofEvent = (id: string) => occurrences.filter((o) => o.eventId === id);
const wall = (d: Date) =>
  d.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).slice(0, 16).replace(' ', 'T');

describe('Forever data', () => {
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
      { ...forever, launches: undefined, regions: anniversary.regions, events: forever.events },
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

describe('launch', () => {
  const catalog = Object.fromEntries(eventDefinitions.map((d) => [d.id, d]));

  it('is one event for Europe and America, which open at the same moment', () => {
    const launches = occurrences.filter((o) => catalog[o.eventId]?.category === 'launch');
    expect(
      launches.map((o) => [o.eventId, o.start.toISOString(), o.end.toISOString(), o.verified]),
    ).toEqual([
      ['forever-launch-eu-na', '2026-11-04T23:00:00.000Z', '2026-11-04T23:01:00.000Z', true],
    ]);
    expect(catalog['forever-launch-eu-na']).toMatchObject({
      name: 'Forever launch (Europe & America)',
      shortName: 'Europe & America launch',
      themeId: 'forever-launch',
      summary:
        'Servers open at the same moment in Europe (Thu, Nov 5, 2026, 00:00 GMT+1) and America (Wed, Nov 4, 2026, 15:00 GMT-8).',
    });
    expect(catalog['forever-launch-eu-na']?.links?.map((l) => l.label)).toEqual([
      'Launch announcement (Europe)',
      'Launch announcement (America)',
    ]);
    expect(forever.launches?.map((l) => l.id)).toEqual(['eu', 'na']);
  });

  it('splits into one event per moment if the launch is staggered', () => {
    const [eu, na] = FOREVER_LAUNCHES;
    const staggered = [{ ...eu!, at: '2026-11-05T15:00:00+01:00' }, na!];
    const defs = launchEvents({
      versionId: 'v',
      title: 'Launch',
      themeId: 'base',
      launches: staggered,
    });
    expect(defs.map((d) => [d.id, d.name, d.summary])).toEqual([
      [
        'v-launch-eu',
        'Launch (Europe)',
        'Servers open in Europe on Thu, Nov 5, 2026, 15:00 (GMT+1).',
      ],
      [
        'v-launch-na',
        'Launch (America)',
        'Servers open in America on Wed, Nov 4, 2026, 15:00 (GMT-8).',
      ],
    ]);
    expect(launchBindings('v', staggered).map((b) => [b.eventId, b.rule.kind])).toEqual([
      ['v-launch-eu', 'moment'],
      ['v-launch-na', 'moment'],
    ]);
  });

  it('is exported to calendars as one entry, like every other event', () => {
    const [feed] = buildFeeds([forever], catalog, span, {
      appName: 'Test',
      appUrl: 'https://example.test/app',
      tentativeLabel: 'tentative',
      locationLabel: 'Location',
    });
    const vevents = (feed?.content ?? '').split('BEGIN:VEVENT').slice(1);
    const launch = vevents.filter((v) => v.includes('SUMMARY:Forever launch'));
    expect(launch).toHaveLength(1);
    expect(launch[0]).toContain('SUMMARY:Forever launch (Europe & America)');
    expect(launch[0]).toContain('DTSTART:20261104T230000Z');
    expect(launch[0]).toContain('UID:forever:forever-launch-eu-na:2026-11-04T23:00:00.000Z');
  });
});

describe('battleground holiday weeks (Call to Arms)', () => {
  const catalog = Object.fromEntries(eventDefinitions.map((d) => [d.id, d]));
  const pvp = occurrences.filter((o) => catalog[o.eventId]?.category === 'pvp');

  it("Forever has the three weeks from Wowhead's Forever calendar, Tuesday 07:00 to Tuesday", () => {
    expect(pvp.map((o) => [o.eventId, wall(o.start), wall(o.end)])).toEqual([
      ['call-to-arms-arathi-basin', '2026-11-03T07:00', '2026-11-10T07:00'],
      ['call-to-arms-warsong-gulch', '2026-11-10T07:00', '2026-11-17T07:00'],
      ['call-to-arms-darkspear-islands', '2026-11-17T07:00', '2026-11-24T07:00'],
    ]);
    for (const o of pvp) {
      expect(o.verified).toBe(false); // Wowhead gives no time zone for 07:00
      expect(o.estimated).toBeUndefined();
      expect(o.source).toMatch(/^https:\/\/www\.wowhead\.com\/forever\/event=\d+\//);
      expect(o.note).toMatch(/Wowhead.*without a time zone/);
    }
  });

  it('Anniversary has no PvP events', () => {
    const all = expandOccurrences(anniversary, 'eu', span).concat(
      expandOccurrences(anniversary, 'us', span),
    );
    expect(all.filter((o) => catalog[o.eventId]?.category === 'pvp')).toEqual([]);
    expect(anniversary.events.some((b) => b.eventId.startsWith('call-to-arms'))).toBe(false);
  });

  it('are exported to calendars like every other event, marked tentative', () => {
    const [feed] = buildFeeds([forever], catalog, span, {
      appName: 'Test',
      appUrl: 'https://example.test/app',
      tentativeLabel: 'tentative',
      locationLabel: 'Location',
    });
    const vevents = (feed?.content ?? '').split('BEGIN:VEVENT').slice(1);
    const ab = vevents.filter((v) => v.includes('Call to Arms: Arathi Basin'));
    expect(ab).toHaveLength(1);
    expect(ab[0]).toContain('SUMMARY:(tentative) Call to Arms: Arathi Basin');
    expect(ab[0]).toContain('DTSTART:20261103T150000Z'); // 07:00 PST
    expect(ab[0]).toContain('CATEGORIES:pvp');
  });
});
