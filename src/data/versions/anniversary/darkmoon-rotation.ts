/**
 * Where the Darkmoon Faire sets up each month on Anniversary realms. The engine already rotates
 * locations (`rotation` + `rotationAnchor` on the monthly rule); it only needs a verified order.
 *
 * TODO: fill in from an Anniversary-specific source (Blizzard news, Wowhead, or the in-game
 * calendar over a few months). Known candidates: Elwynn Forest, Mulgore, Terokkar Forest; the
 * order and anchor month are NOT confirmed. While this is null, no location is shown.
 *
 * Shape when known:
 *   {
 *     order: ['<location of anchorMonth>', '<next month>', ...], // repeats in this order
 *     anchorMonth: 'YYYY-MM', // a month in which order[0] hosts the Faire
 *     source: 'https://…',
 *   }
 */
export const DARKMOON_ROTATION: {
  order: string[];
  anchorMonth: string;
  source: string;
} | null = null;
