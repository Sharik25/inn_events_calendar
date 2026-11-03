import { expandOccurrences } from '@/engine';
import { forever } from '../versions/forever/version';

const span = { start: new Date('2026-11-01T00:00Z'), end: new Date('2027-03-01T00:00Z') };

describe('WoW: Forever data', () => {
  const occurrences = expandOccurrences(forever, 'global', span);

  it('has the four Darkmoon Faire visits from the game client, with their sites', () => {
    expect(occurrences.map((o) => [o.eventId, o.start.toISOString(), o.location])).toEqual([
      ['darkmoon-faire', '2026-11-09T08:00:00.000Z', 'Elwynn Forest'], // 00:00 PST
      ['darkmoon-faire', '2026-12-07T08:00:00.000Z', 'Mulgore (below Thunder Bluff)'],
      ['darkmoon-faire', '2027-01-04T08:00:00.000Z', 'Elwynn Forest'],
      ['darkmoon-faire', '2027-02-08T08:00:00.000Z', 'Mulgore (below Thunder Bluff)'],
    ]);
    for (const o of occurrences) expect(o.end.getTime() - o.start.getTime()).toBe(7 * 86_400_000);
  });

  it('marks every date unconfirmed, with its source and what is assumed', () => {
    for (const o of occurrences) {
      expect(o.verified).toBe(false);
      expect(o.source).toBe('https://bindonforever.com/articles/build-70707');
      expect(o.note).toMatch(/not announced by Blizzard.*time of day is assumed/);
    }
  });
});
