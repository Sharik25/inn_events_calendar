import { INK, svg } from './helpers';

/** Brushed steel, lit from the left (blades, helmet, shield boss). */
const STEEL = `<linearGradient id="pv-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef3f8"/><stop offset=".55" stop-color="#b9c4d2"/><stop offset="1" stop-color="#7d8798"/></linearGradient>`;

/** One upright sword: steel blade, gold crossguard, crimson grip, gold pommel. */
const sword = `<path d="M50 4 L57 15 V62 H43 V15 Z" fill="url(#pv-b)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M50 10 V58" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>
<rect x="32" y="60" width="36" height="8" rx="3" fill="#e6c06a" stroke="${INK}" stroke-width="3"/>
<rect x="45" y="68" width="10" height="17" rx="2" fill="#b8333a" stroke="${INK}" stroke-width="2.5"/>
<circle cx="50" cy="89" r="6" fill="#e6c06a" stroke="${INK}" stroke-width="2.5"/>`;

/** Two swords crossed at (50, 52) in a 100×100 box. */
const swordPair = `<g transform="rotate(-42 50 52)">${sword}</g>
<g transform="rotate(42 50 52)">${sword}</g>`;

/** Two crossed swords: battleground holiday weeks. */
export const crossedSwords = svg('0 0 100 100', `<defs>${STEEL}</defs>${swordPair}`);

/*
 * War garland: a rope sagging between the tile's edges (same height at both ends, so copies repeat
 * seamlessly), with a horned war helmet, a heater shield and crossed swords hung at even spacing
 * (x = 40, 120, 200 in a 240-wide tile: 80 apart, across the seam too). The rope is a quadratic
 * curve from (0, 6) through control point (120, 30) to (240, 6): y = 12.7 at x = 40 and 200, 18 at 120.
 */

/** Horned war helmet centred on x = 40, hanging from the rope at y ≈ 12.7. */
const helmet = `<path d="M40 12.7 V20" stroke="#5a3a1c" stroke-width="2"/>
<path d="M29 33 Q19 30 20 17 Q25 26 31 28 Z" fill="url(#pg-horn)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M51 33 Q61 30 60 17 Q55 26 49 28 Z" fill="url(#pg-horn)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M36 22 Q38 13 46 15 Q42 17 43 22 Z" fill="#b8333a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M27 40 Q27 21 40 21 Q53 21 53 40 V50 Q50 54 46 50 V45 H34 V50 Q30 54 27 50 Z" fill="url(#pv-b)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M32 28 Q34 23 40 23" fill="none" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>
<path d="M34 40 H46 V45 Q46 49 42 50 H38 Q34 49 34 45 Z" fill="#2a1d18" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
<rect x="38.6" y="38" width="2.8" height="11" rx="1" fill="url(#pv-b)" stroke="${INK}" stroke-width="1.5"/>
<rect x="26" y="35" width="28" height="5" rx="2" fill="#e6c06a" stroke="${INK}" stroke-width="2"/>
<g fill="#7a5a1a"><circle cx="30" cy="37.5" r="1"/><circle cx="35" cy="37.5" r="1"/><circle cx="45" cy="37.5" r="1"/><circle cx="50" cy="37.5" r="1"/></g>`;

/** Heater shield centred on x = 120, on two straps from the rope's lowest point (y = 18). */
const shield = `<path d="M114 18.2 L108 25 M126 18.2 L132 25" stroke="#5a3a1c" stroke-width="2" stroke-linecap="round"/>
<path d="M105 25 H135 V39 Q135 53 120 61 Q105 53 105 39 Z" fill="#e6c06a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M108.5 28 H120 V57 Q108.5 50 108.5 39 Z" fill="url(#pg-red)"/>
<path d="M120 28 H131.5 V39 Q131.5 50 120 57 Z" fill="url(#pg-blue)"/>
<path d="M110 50 L120 42 L130 50" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round"/>
<path d="M110 50 L120 42 L130 50" fill="none" stroke="#e6c06a" stroke-width="3.5" stroke-linejoin="round"/>
<circle cx="120" cy="33" r="3.2" fill="url(#pv-b)" stroke="${INK}" stroke-width="1.5"/>
<path d="M111 30 Q110 38 112 46" fill="none" stroke="#fff" stroke-width="1.8" opacity=".4" stroke-linecap="round"/>`;

/** Crossed swords centred on x = 200, tied to the rope at y ≈ 12.7. */
const swords = `<path d="M200 12.7 V24" stroke="#5a3a1c" stroke-width="2"/>
<g transform="translate(178 17) scale(0.44)">${swordPair}</g>`;

/** A knot of rope with a gold band where each piece hangs. */
const knot = (x: number, y: number) =>
  `<rect x="${x - 2.5}" y="${y - 3}" width="5" height="6" rx="1.5" fill="#e6c06a" stroke="${INK}" stroke-width="1.5"/>`;

/** Battleground holiday garland for the top edge: helmet, shield and swords on a rope. */
export const warGarland = svg(
  '0 0 240 64',
  `<defs>${STEEL}
<linearGradient id="pg-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6464c"/><stop offset="1" stop-color="#8e2228"/></linearGradient>
<linearGradient id="pg-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4677bd"/><stop offset="1" stop-color="#22457a"/></linearGradient>
<linearGradient id="pg-horn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset="1" stop-color="#a8916a"/></linearGradient></defs>
${helmet}${shield}${swords}
<path d="M0 6 Q120 30 240 6" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M0 6 Q120 30 240 6" fill="none" stroke="#a87a44" stroke-width="3" stroke-linecap="round"/>
<path d="M0 6 Q120 30 240 6" fill="none" stroke="#e0b97a" stroke-width="1.2" stroke-dasharray="3 4"/>
${knot(40, 12.7)}${knot(120, 18)}${knot(200, 12.7)}`,
);
