import { polar, sparklePath, svg } from './helpers';

/**
 * A refined firework for launch day: thin rays of two lengths with tiny tips around a small
 * sparkle. Line art only (no fills to speak of), so it stays light over text and backgrounds.
 * `weight` thickens the lines for small sizes (cell accents, medallions), where 2px would vanish.
 */
export function lineBurst(ray: string, tip: string, rays = 14, weight = 1) {
  const parts: string[] = [];
  for (let i = 0; i < rays; i++) {
    const long = i % 2 === 0;
    const deg = (i * 360) / rays;
    const [x1, y1] = polar(60, 60, long ? 16 : 20, deg);
    const [x2, y2] = polar(60, 60, long ? 54 : 40, deg);
    parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${long ? ray : tip}" stroke-width="${(long ? 2 : 1.5) * weight}" stroke-linecap="round" opacity="${long ? 1 : 0.8}"/>`,
      `<circle cx="${x2}" cy="${y2}" r="${(long ? 2.6 : 1.8) * Math.sqrt(weight)}" fill="${tip}"/>`,
    );
  }
  return svg('0 0 120 120', `${parts.join('')}<path d="${sparklePath(60, 60, 9)}" fill="${tip}"/>`);
}
