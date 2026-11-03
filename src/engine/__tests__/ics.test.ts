import ICAL from 'ical.js';
import type { EventCatalog, EventDefinition, Occurrence, VersionConfig } from '@/domain/types';
import { buildFeeds, feedFileName } from '../feeds';
import {
  buildIcs,
  escapeText,
  foldLine,
  googleCalendarUrl,
  icsDate,
  occurrenceAppUrl,
  occurrenceOnDay,
  occurrenceToIcsEvent,
  occurrenceUid,
  spansSeveralDays,
} from '../ics';

const def: EventDefinition = {
  id: 'hallows-end',
  name: "Hallow's End",
  category: 'holiday',
  rarity: 'annual',
  themeId: 'hallows-end',
  summary: 'Trick-or-treat; costumes, and the Headless Horseman.',
};
const occ: Occurrence = {
  key: 'anniversary:hallows-end:2026-10-18T08:00:00.000Z',
  eventId: 'hallows-end',
  versionId: 'anniversary',
  start: new Date('2026-10-18T08:00:00Z'),
  end: new Date('2026-11-01T09:00:00Z'),
  verified: true,
};
const opts = {
  appUrl: 'https://almanac.example/',
  tentativeLabel: 'tentative',
  locationLabel: 'Location',
};

/** Parses with Mozilla's ical.js: throws on malformed iCalendar. */
function parse(ics: string) {
  const cal = new ICAL.Component(ICAL.parse(ics));
  return { cal, events: cal.getAllSubcomponents('vevent').map((c) => new ICAL.Event(c)) };
}

describe('iCalendar primitives', () => {
  it('formats UTC timestamps', () => {
    expect(icsDate(new Date('2026-10-18T08:00:00.000Z'))).toBe('20261018T080000Z');
  });

  it('escapes TEXT values', () => {
    expect(escapeText('a\\b; c, d\ne')).toBe('a\\\\b\\; c\\, d\\ne');
  });

  it('folds long lines at 75 octets without splitting UTF-8 characters', () => {
    const line = `DESCRIPTION:${'é'.repeat(80)}`;
    const folded = foldLine(line);
    const enc = new TextEncoder();
    for (const part of folded.split('\r\n'))
      expect(enc.encode(part).length).toBeLessThanOrEqual(75);
    expect(
      folded
        .split('\r\n')
        .map((p, i) => (i ? p.slice(1) : p))
        .join(''),
    ).toBe(line);
    expect(foldLine('SHORT:1')).toBe('SHORT:1');
  });
});

describe('occurrence export', () => {
  it('maps an occurrence with a stable UID, link and summary', () => {
    const e = occurrenceToIcsEvent(occ, def, opts);
    expect(e.uid).toBe('anniversary:hallows-end:2026-10-18T08:00:00.000Z@innkeepers-almanac');
    expect(e.uid).toBe(occurrenceUid(occ));
    expect(e.title).toBe("Hallow's End");
    expect(e.url).toBe(
      'https://almanac.example/anniversary/day/2026-10-18?event=hallows-end&on=2026-10-18',
    );
    expect(occurrenceAppUrl(occ, 'https://x.test')).toContain('https://x.test/anniversary/');
    expect(e.description).toContain(def.summary);
  });

  it('marks unverified dates as tentative and adds location and notes', () => {
    const e = occurrenceToIcsEvent(
      { ...occ, verified: false, location: 'Mulgore', note: 'Time assumed.' },
      def,
      { ...opts, appUrl: undefined },
    );
    expect(e.title).toBe("(tentative) Hallow's End");
    expect(e.description).toBe(`${def.summary}\n\nLocation: Mulgore\n\nTime assumed.`);
    expect(e).not.toHaveProperty('url');
    expect(e.location).toBe('Mulgore');
  });

  it('builds a valid calendar that round-trips through a parser', () => {
    const ics = buildIcs({
      name: "Innkeeper's Almanac test",
      description: 'Desc',
      refreshHours: 12,
      stamp: new Date('2026-10-27T00:00:00Z'),
      events: [occurrenceToIcsEvent({ ...occ, location: 'Goldshire, Elwynn' }, def, opts)],
    });
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);

    const { cal, events } = parse(ics);
    expect(cal.getFirstPropertyValue('x-wr-calname')).toBe("Innkeeper's Almanac test");
    expect(cal.getFirstPropertyValue('refresh-interval')?.toString()).toBe('PT12H');
    const [e] = events;
    expect(e?.uid).toBe(occurrenceUid(occ));
    expect(e?.summary).toBe("Hallow's End");
    expect(e?.location).toBe('Goldshire, Elwynn');
    expect(e?.startDate.toJSDate().toISOString()).toBe('2026-10-18T08:00:00.000Z');
    expect(e?.endDate.toJSDate().toISOString()).toBe('2026-11-01T09:00:00.000Z');
    expect(e?.description).toContain('Trick-or-treat; costumes, and the Headless Horseman.');
  });

  it('adds a reminder as a VALARM that parsers read back', () => {
    const event = { ...occurrenceToIcsEvent(occ, def, opts), alarmMinutes: 60 };
    const ics = buildIcs({ events: [event], stamp: new Date('2026-10-27T00:00:00Z') });
    expect(ics).toContain(
      "BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Hallow's End\r\nTRIGGER:-PT60M\r\nEND:VALARM\r\nEND:VEVENT",
    );
    const vevent = new ICAL.Component(ICAL.parse(ics)).getFirstSubcomponent('vevent')!;
    const alarm = vevent.getFirstSubcomponent('valarm')!;
    expect(alarm.getFirstPropertyValue('action')).toBe('DISPLAY');
    expect((alarm.getFirstPropertyValue('trigger') as ICAL.Duration).toSeconds()).toBe(-3600);

    const quiet = buildIcs({ events: [occurrenceToIcsEvent(occ, def, opts)] });
    expect(quiet).not.toContain('VALARM');
  });

  it('builds a Google Calendar template link', () => {
    const url = new URL(
      googleCalendarUrl(occurrenceToIcsEvent({ ...occ, location: 'Inn' }, def, opts)),
    );
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe("Hallow's End");
    expect(url.searchParams.get('dates')).toBe('20261018T080000Z/20261101T090000Z');
    expect(url.searchParams.get('details')).toContain('almanac.example');
    expect(url.searchParams.get('location')).toBe('Inn');
    const bare = new URL(
      googleCalendarUrl({ uid: 'u', start: occ.start, end: occ.end, title: 'T' }),
    );
    expect(bare.searchParams.has('details')).toBe(false);
  });
});

describe('one day of an event', () => {
  it('clips the occurrence to the day, with its own key and UID', () => {
    // Hallow's End runs Oct 18, 10:00 – Nov 1, 10:00 in Paris.
    const middle = occurrenceOnDay(occ, '2026-10-27', 'Europe/Paris')!;
    expect([middle.start.toISOString(), middle.end.toISOString()]).toEqual([
      '2026-10-26T23:00:00.000Z', // Oct 27, 00:00 CET
      '2026-10-27T23:00:00.000Z',
    ]);
    expect(middle.key).toBe(`${occ.key}/2026-10-27`);
    expect(occurrenceUid(middle)).not.toBe(occurrenceUid(occ));
    expect(middle).toMatchObject({ eventId: occ.eventId, verified: true });

    const first = occurrenceOnDay(occ, '2026-10-18', 'Europe/Paris')!;
    expect(first.start).toEqual(occ.start); // starts at the event's own start time
    const last = occurrenceOnDay(occ, '2026-11-01', 'Europe/Paris')!;
    expect(last.end).toEqual(occ.end);
    expect(occurrenceOnDay(occ, '2026-11-02', 'Europe/Paris')).toBeNull();
  });

  it('tells multi-day events from one-day ones', () => {
    expect(spansSeveralDays(occ, 'Europe/Paris')).toBe(true);
    const evening = {
      start: new Date('2026-10-25T13:00:00Z'),
      end: new Date('2026-10-25T15:00:00Z'),
    };
    expect(spansSeveralDays(evening, 'Europe/Paris')).toBe(false);
    // Ending exactly at midnight still counts as one day.
    const fullDay = {
      start: new Date('2026-10-26T23:00:00Z'),
      end: new Date('2026-10-27T23:00:00Z'),
    };
    expect(spansSeveralDays(fullDay, 'Europe/Paris')).toBe(false);
  });

  it('can title the export differently', () => {
    expect(occurrenceToIcsEvent(occ, def, opts, "Hallow's End (Tue, Oct 27)").title).toBe(
      "Hallow's End (Tue, Oct 27)",
    );
  });
});

describe('feeds', () => {
  const version: VersionConfig = {
    id: 'v',
    name: 'Version',
    shortName: 'V',
    status: 'live',
    regions: [
      { id: 'us', label: 'Americas', timeZone: 'America/Los_Angeles' },
      { id: 'eu', label: 'Europe', timeZone: 'Europe/Paris' },
    ],
    defaultRegionId: 'eu',
    baseThemeId: 'base',
    events: [
      {
        eventId: 'fishing',
        rule: {
          kind: 'weekly',
          weekday: 0,
          startTime: '14:00',
          durationMinutes: 120,
          verified: true,
        },
      },
      {
        eventId: 'phase',
        rule: {
          kind: 'weekly',
          weekday: 1,
          startTime: '10:00',
          durationMinutes: 60,
          verified: true,
        },
      },
    ],
  };
  const empty: VersionConfig = { ...version, id: 'empty', events: [] };
  const catalog: EventCatalog = {
    fishing: { ...def, id: 'fishing', name: 'Fishing', category: 'fishing', rarity: 'weekly' },
    phase: { ...def, id: 'phase', name: 'Phase', category: 'milestone', rarity: 'once' },
  };
  const range = { start: new Date('2026-10-01T00:00Z'), end: new Date('2026-11-01T00:00Z') };

  it('writes one valid feed per region, skipping milestones and empty versions', () => {
    const feeds = buildFeeds([version, empty], catalog, range, { ...opts, appName: 'Almanac' });
    expect(feeds.map((f) => f.fileName)).toEqual(['v-us.ics', 'v-eu.ics']);
    expect(feedFileName('anniversary', 'eu')).toBe('anniversary-eu.ics');
    for (const feed of feeds) {
      const { cal, events } = parse(feed.content);
      expect(events).toHaveLength(4); // Sundays in Oct 2026: 4, 11, 18, 25
      expect(feed.eventCount).toBe(4);
      expect(new Set(events.map((e) => e.uid)).size).toBe(4);
      expect(cal.getFirstPropertyValue('x-wr-calname')).toMatch(
        /^Almanac · V \((Americas|Europe)\)$/,
      );
    }
    // Same server wall time in both regions → different UTC instants → different UIDs.
    const [us, eu] = feeds.map((f) => parse(f.content).events[0]?.uid);
    expect(us).not.toBe(eu);
  });

  it('produces identical UIDs on every build (re-imports update, never duplicate)', () => {
    const a = buildFeeds([version], catalog, range, { ...opts, appName: 'A' });
    const b = buildFeeds([version], catalog, range, { ...opts, appName: 'A' });
    const uids = (content: string) => parse(content).events.map((e) => e.uid);
    expect(uids(a[0]!.content)).toEqual(uids(b[0]!.content));
  });
});
