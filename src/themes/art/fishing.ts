import { INK, svg } from './helpers';

/** Fish leaping out of the water. */
export const leapingFish = svg(
  '0 0 130 72',
  `<defs><linearGradient id="fs-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fc1c9"/><stop offset=".6" stop-color="#1e7f93"/><stop offset="1" stop-color="#e2b85a"/></linearGradient></defs>
<path d="M92 36 L124 12 L118 36 L124 60 Z" fill="#1e7f93" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M6 36 C24 8 70 6 96 36 C70 66 24 64 6 36 Z" fill="url(#fs-g)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M46 16 L60 4 L68 18 Z" fill="#1e7f93" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<g fill="none" stroke="#bff3f7" stroke-width="1.5" opacity=".6"><path d="M44 28 Q48 34 44 40"/><path d="M54 26 Q58 34 54 42"/><path d="M64 28 Q68 34 64 40"/></g>
<circle cx="22" cy="31" r="5" fill="#fff" stroke="${INK}" stroke-width="1.5"/><circle cx="21" cy="31" r="2.5" fill="${INK}"/>
<path d="M8 40 Q14 42 18 40" stroke="${INK}" stroke-width="1.5" fill="none"/>`,
);

/** Water ripples along the bottom edge; seamless 200px tile. */
export const ripples = svg(
  '0 0 200 40',
  `<path d="M0 14 Q25 4 50 14 T100 14 T150 14 T200 14 V40 H0 Z" fill="#0f5664" opacity=".85"/>
<path d="M0 22 Q25 12 50 22 T100 22 T150 22 T200 22" fill="none" stroke="#5fd3dd" stroke-width="2" opacity=".7"/>
<path d="M0 14 Q25 4 50 14 T100 14 T150 14 T200 14" fill="none" stroke="#bff3f7" stroke-width="2.5"/>
<path d="M20 32 Q35 28 50 32 M120 30 Q135 26 150 30" fill="none" stroke="#bff3f7" stroke-width="1.5" opacity=".5"/>`,
);

/**
 * A fishing rod held from the shore (lower left of the box) casting into the water: its line drops
 * a red-and-white bobber from the rod tip (78, 12) to the water surface (y = 140), where it splashes.
 * The `cast` decoration motion animates the parts by class: `deco-cast-line` (grows from the tip),
 * `deco-cast-bobber` (falls by --cast-drop, then bobs and is reeled in) and `deco-cast-splash` (a
 * ring when it lands). At rest (reduced motion) the bobber floats on the water and the line is out.
 */
const CAST = `<defs><linearGradient id="fc-rod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b7793c"/><stop offset="1" stop-color="#6b3d1a"/></linearGradient>
<radialGradient id="fc-reel" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#fff1b8"/><stop offset=".6" stop-color="#e0b85c"/><stop offset="1" stop-color="#8a6420"/></radialGradient></defs>
<g class="deco-cast-splash" opacity="0" fill="none" stroke="#bff3f7" stroke-width="2">
<ellipse cx="78" cy="141" rx="13" ry="3.5"/><ellipse cx="78" cy="141" rx="7" ry="2" opacity=".7"/></g>
<line class="deco-cast-line" x1="78" y1="13" x2="78" y2="140" stroke="#e8f7f5" stroke-width="1.2" opacity=".85"/>
<polygon points="-7.1,164.4 76.9,11.4 79.1,12.6 -0.9,167.6" fill="url(#fc-rod)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
<line x1="1.6" y1="155.4" x2="18.6" y2="123.7" stroke="${INK}" stroke-width="11.5" stroke-linecap="round"/>
<line x1="1.6" y1="155.4" x2="18.6" y2="123.7" stroke="#c98a4b" stroke-width="8" stroke-linecap="round"/>
<line x1="3.5" y1="151" x2="16.5" y2="127" stroke="#e7b07a" stroke-width="2" stroke-linecap="round" opacity=".7"/>
<g stroke="${INK}" stroke-width="1.8"><line x1="29.5" y1="118" x2="24" y2="115"/><circle cx="29.5" cy="118.1" r="6.5" fill="url(#fc-reel)"/><circle cx="29.5" cy="118.1" r="2" fill="#6b3d1a"/></g>
<g stroke="#e0b85c" stroke-width="2.5" stroke-linecap="round"><line x1="38.5" y1="79.9" x2="43.7" y2="82.7"/><line x1="58.6" y1="47" x2="63" y2="49.4"/></g>
<circle cx="78" cy="12" r="1.8" fill="#e0b85c" stroke="${INK}" stroke-width="1"/>
<g class="deco-cast-bobber" style="--cast-drop: -127px">
<line x1="78" y1="127" x2="78" y2="133" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="78" cy="126.5" r="1.4" fill="#e04a3c" stroke="${INK}" stroke-width=".8"/>
<path d="M71 140 A7 7 0 0 1 85 140 Z" fill="#e04a3c"/>
<path d="M71 140 A7 7 0 0 0 85 140 Z" fill="#f4efe6"/>
<line x1="71" y1="140" x2="85" y2="140" stroke="${INK}" stroke-width="1.2"/>
<circle cx="78" cy="140" r="7" fill="none" stroke="${INK}" stroke-width="2"/>
<circle cx="75" cy="137" r="1.6" fill="#fff" opacity=".75"/></g>`;

/** The rod casting; `mirror` holds it from the right (for the bottom-right corner). */
export function fishingCast(mirror = false): string {
  return svg('0 0 120 170', mirror ? `<g transform="matrix(-1 0 0 1 120 0)">${CAST}</g>` : CAST);
}
