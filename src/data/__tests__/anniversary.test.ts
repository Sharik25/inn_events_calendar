import { dayRange, expandOccurrences, occurrencesOnDay, pickDominant } from '@/engine';
import { eventCatalog } from '../events';
import { DARKMOON_ROTATION } from '../versions/anniversary/darkmoon-rotation';
import { anniversary } from '../versions/anniversary/version';

const year = {
  start: new Date('2026-01-01T00:00Z'),
  end: new Date('2027-01-01T00:00Z'),
};

function dominantOn(date: string, regionId: string, timeZone: string) {
  const occurrences = expandOccurrences(anniversary, regionId, dayRange(date, timeZone));
  return pickDominant(occurrencesOnDay(occurrences, date, timeZone, eventCatalog), eventCatalog);
}

describe('Anniversary data through the engine', () => {
  it("shows Hallow's End today (Oct 27, 2026) for an EU player", () => {
    expect(dominantOn('2026-10-27', 'eu', 'Asia/Jerusalem')?.eventId).toBe('hallows-end');
  });

  it('shows Fireworks over Midsummer on Jul 4', () => {
    expect(dominantOn('2026-07-04', 'us', 'America/New_York')?.eventId).toBe(
      'fireworks-spectacular',
    );
  });

  it('shows the Darkmoon Faire over fishing on a faire Sunday', () => {
    expect(dominantOn('2026-11-15', 'eu', 'Europe/Paris')?.eventId).toBe('darkmoon-faire');
  });

  it('shows fishing on a quiet Sunday and nothing on a quiet weekday', () => {
    expect(dominantOn('2026-11-22', 'eu', 'Europe/Paris')?.eventId).toBe('stv-fishing');
    expect(dominantOn('2026-11-24', 'eu', 'Europe/Paris')).toBeNull();
  });

  it('shows Darkmoon Faire locations only from the verified rotation constant', () => {
    const faires = expandOccurrences(anniversary, 'eu', year).filter(
      (o) => o.eventId === 'darkmoon-faire',
    );
    if (!DARKMOON_ROTATION) {
      expect(faires.every((o) => o.location === undefined)).toBe(true);
      return;
    }
    const { order } = DARKMOON_ROTATION;
    for (const faire of faires) expect(order).toContain(faire.location);
  });

  it('expands a full year in every region', () => {
    for (const region of anniversary.regions) {
      const occurrences = expandOccurrences(anniversary, region.id, year);
      expect(occurrences.filter((o) => o.eventId === 'stv-fishing')).toHaveLength(52);
      expect(
        occurrences.filter((o) => o.eventId === 'darkmoon-faire').length,
      ).toBeGreaterThanOrEqual(12);
      expect(occurrences.find((o) => o.eventId === 'hallows-end')?.verified).toBe(true);
    }
  });
});
