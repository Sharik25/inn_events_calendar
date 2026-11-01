import type { EventCatalog, EventDefinition, Occurrence } from '@/domain/types';
import {
  buildDayAgenda,
  filterByCategory,
  findOccurrenceForDay,
  isOneDay,
  oneDayOverlaps,
  timingAt,
} from '../agenda';

const def = (
  id: string,
  rarity: EventDefinition['rarity'],
  category: EventDefinition['category'],
) => ({ id, name: id, category, rarity, themeId: id, summary: id }) satisfies EventDefinition;

const catalog: EventCatalog = {
  hallows: def('hallows', 'annual', 'holiday'),
  fishing: def('fishing', 'weekly', 'fishing'),
  dmf: def('dmf', 'monthly', 'faire'),
  phase: def('phase', 'once', 'milestone'),
};

const occ = (eventId: string, start: string, end: string): Occurrence => ({
  key: `v:${eventId}:${start}`,
  eventId,
  versionId: 'v',
  start: new Date(start),
  end: new Date(end),
  verified: true,
});

const hallows = occ('hallows', '2026-10-18T08:00Z', '2026-11-01T09:00Z');
const fishing1 = occ('fishing', '2026-10-25T13:00Z', '2026-10-25T15:00Z');
const fishing2 = occ('fishing', '2026-11-01T13:00Z', '2026-11-01T15:00Z');
const fishing3 = occ('fishing', '2026-11-08T13:00Z', '2026-11-08T15:00Z');
const dmf = occ('dmf', '2026-11-08T23:00Z', '2026-11-15T23:00Z');
const dmfLater = occ('dmf', '2026-12-06T23:00Z', '2026-12-13T23:00Z');
const phase = occ('phase', '2026-10-27T10:00Z', '2026-10-27T11:00Z');
const all = [hallows, fishing1, phase, fishing2, fishing3, dmf, dmfLater];

describe('filterByCategory', () => {
  it('hides categories and events missing from the catalog', () => {
    const ghost = occ('ghost', '2026-10-27T10:00Z', '2026-10-27T11:00Z');
    expect(filterByCategory([...all, ghost], catalog, ['milestone'])).not.toContain(phase);
    expect(filterByCategory([...all, ghost], catalog, [])).toEqual(all);
  });
});

describe('buildDayAgenda', () => {
  it('lists the active events dominant-first and the next occurrence of others', () => {
    const agenda = buildDayAgenda(
      filterByCategory(all, catalog, ['milestone']),
      '2026-10-27',
      'Europe/Paris',
      catalog,
    );
    expect(agenda.dominant).toBe(hallows);
    expect(agenda.active).toEqual([hallows]);
    expect(agenda.comingSoon).toEqual([fishing2, dmf]); // one per event, in start order
  });

  it('excludes events already active that day from coming soon', () => {
    const agenda = buildDayAgenda(all, '2026-11-08', 'Europe/Paris', catalog);
    expect(agenda.active).toEqual([fishing3]); // DMF opens at 00:00 Nov 9 Paris time
    expect(agenda.comingSoon.map((o) => o.eventId)).toEqual(['dmf']);
  });

  it('respects the horizon and returns null dominant on a quiet day', () => {
    const agenda = buildDayAgenda(all, '2026-11-20', 'Europe/Paris', catalog, 10);
    expect(agenda.dominant).toBeNull();
    expect(agenda.active).toEqual([]);
    expect(agenda.comingSoon).toEqual([]);
  });
});

describe('timingAt', () => {
  it('reports upcoming, active and ended with the relevant distance', () => {
    expect(timingAt(fishing1, new Date('2026-10-25T12:00Z'))).toEqual({
      phase: 'upcoming',
      ms: 3_600_000,
    });
    expect(timingAt(fishing1, new Date('2026-10-25T14:30Z'))).toEqual({
      phase: 'active',
      ms: 1_800_000,
    });
    expect(timingAt(fishing1, new Date('2026-10-25T15:00Z'))).toEqual({ phase: 'ended', ms: 0 });
  });
});

describe('findOccurrenceForDay', () => {
  it('prefers the occurrence on the day, then the next, then the previous', () => {
    expect(findOccurrenceForDay(all, 'fishing', '2026-11-01', 'Europe/Paris')).toBe(fishing2);
    expect(findOccurrenceForDay(all, 'fishing', '2026-10-27', 'Europe/Paris')).toBe(fishing2);
    expect(findOccurrenceForDay(all, 'fishing', '2026-12-01', 'Europe/Paris')).toBe(fishing3);
    expect(findOccurrenceForDay(all, 'nope', '2026-12-01', 'Europe/Paris')).toBeNull();
  });
});

describe('oneDayOverlaps', () => {
  it('counts anything up to 24 hours as one-day', () => {
    expect(isOneDay(fishing1)).toBe(true);
    expect(isOneDay(occ('fireworks', '2026-07-04T08:00Z', '2026-07-05T08:00Z'))).toBe(true);
    expect(isOneDay(occ('fireworks', '2026-07-04T08:00Z', '2026-07-05T08:01Z'))).toBe(false);
    expect(isOneDay(dmf)).toBe(false);
  });

  it('lists one-day events of other events inside the long event, earliest first', () => {
    // fishing2 starts 4h after Hallow's End ends; DMF is long-running itself.
    expect(oneDayOverlaps([dmf, fishing2, phase, fishing1, hallows, phase], hallows)).toEqual([
      fishing1,
      phase,
    ]);
  });

  it('includes one-day events that only partly overlap the long event', () => {
    const lateNight = occ('phase', '2026-11-01T06:00Z', '2026-11-01T12:00Z');
    expect(oneDayOverlaps([lateNight], hallows)).toEqual([lateNight]);
  });

  it('has nothing to add to a one-day event', () => {
    expect(oneDayOverlaps(all, fishing1)).toEqual([]);
  });
});
