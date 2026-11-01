import { INK, svg, svgDataUrl } from '@/themes/art/helpers';
import styles from './FestiveGarland.module.css';

/**
 * One seamlessly tiling pine swag (original SVG, no game art): the band dips to the centre and
 * returns to the same height at both edges, so copies repeat cleanly across any width. Red and gold
 * baubles hang inside the tile. Chunky INK outlines, cel-shaded gradients — the house art style.
 */
const GARLAND = svg(
  '0 0 240 100',
  `<defs>
    <linearGradient id="pine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#368a4e"/>
      <stop offset="1" stop-color="#14502b"/>
    </linearGradient>
    <radialGradient id="red" cx="0.35" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#ff7d70"/>
      <stop offset="0.55" stop-color="#c0392b"/>
      <stop offset="1" stop-color="#7a1b13"/>
    </radialGradient>
    <radialGradient id="gold" cx="0.35" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#ffe59a"/>
      <stop offset="0.55" stop-color="#e6b422"/>
      <stop offset="1" stop-color="#946a12"/>
    </radialGradient>
  </defs>
  <g fill="none" stroke="#0f3d22" stroke-width="5" stroke-linecap="round">
    <path d="M22 24 L10 14 M34 32 L24 20 M60 50 L54 36 M96 66 L92 50 M120 70 L120 53
             M144 66 L148 50 M180 50 L186 36 M206 32 L216 20 M218 24 L230 14"/>
  </g>
  <path d="M0 12 Q120 64 240 12 L240 30 Q120 84 0 30 Z"
        fill="url(#pine)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M8 22 Q120 70 232 22" fill="none" stroke="#5fb873" stroke-width="2.5"
        stroke-linecap="round" opacity="0.7"/>
  <g stroke="#0f3d22" stroke-width="2.5" stroke-linecap="round">
    <line x1="60" y1="50" x2="60" y2="60"/>
    <line x1="120" y1="70" x2="120" y2="80"/>
    <line x1="180" y1="50" x2="180" y2="60"/>
  </g>
  <g stroke="${INK}" stroke-width="2">
    <circle cx="60" cy="68" r="8" fill="url(#gold)"/>
    <circle cx="120" cy="88" r="9" fill="url(#red)"/>
    <circle cx="180" cy="68" r="8" fill="url(#gold)"/>
  </g>
  <g fill="#ffffff" opacity="0.65" stroke="none">
    <circle cx="57" cy="65" r="2"/>
    <circle cx="117" cy="84" r="2.3"/>
    <circle cx="177" cy="65" r="2"/>
  </g>`,
);

/**
 * A festive garland strip pinned to the top of the viewport. Purely decorative — hidden from
 * assistive tech, never captures clicks. Gently bobs, unless reduced motion is requested (via the
 * `reducedMotion` prop, which already folds in the OS preference, or a direct OS preference).
 *
 * Render it only when it should show (e.g. the Feast of Winter Veil is the viewed event); it draws
 * unconditionally.
 */
export function FestiveGarland({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <div
      className={styles.garland}
      aria-hidden="true"
      data-testid="festive-garland"
      data-motion={reducedMotion ? 'reduce' : undefined}
      style={{ backgroundImage: svgDataUrl(GARLAND) }}
    />
  );
}
