import { lineBurst } from '../art/launch';
import { bunting, sparkle } from '../art/shared';
import type { ThemeDefinition } from '../types';

const sea = '#3cc6d6';
const gold = '#f2c45a';
const pale = '#fff1c2';

/** Faint gold stars over the sea-blue night sky. */
const stars = [
  '10% 14%',
  '24% 6%',
  '38% 20%',
  '57% 9%',
  '71% 24%',
  '88% 11%',
  '6% 40%',
  '31% 34%',
  '62% 38%',
  '93% 44%',
]
  .map((at) => `radial-gradient(1.5px 1.5px at ${at}, rgb(255 233 168 / 0.85), transparent)`)
  .join(', ');

/**
 * WoW: Forever's launch day: a deep sea-blue night with gold. Gold and sea-blue pennants along
 * the top, gold sparkles, and thin fireworks in both colors that open and fade in turn (still
 * under reduced motion; on phones only the pennants and sparkles, clear of the content).
 */
export const theme: ThemeDefinition = {
  id: 'forever-launch',
  label: 'Forever launch',
  tokens: {
    '--color-bg': '#061c2a',
    '--color-surface': '#f3ead6',
    '--color-ink': '#132430',
    '--color-ink-muted': '#3f5462',
    '--color-ink-on-dark': '#f7efdc',
    '--color-ink-on-dark-muted': '#b4cbd4',
    '--color-accent': sea,
    '--color-gold': gold,
    '--color-frame': '#0a2b3b',
    '--glow': '0 0 16px rgb(242 196 90 / 0.55)',
    '--cell-tint': 'rgb(60 198 214 / 0.16)',
    '--particle-color': '#ffe08a',
  },
  background: {
    css: [
      stars,
      // A bright sea-blue sky light (gold haze over blue would turn murky green); gold lives in the
      // stars, pennants, sparkles and fireworks.
      'radial-gradient(ellipse at 50% 0%, rgb(120 222 238 / 0.2), transparent 55%)',
      'radial-gradient(ellipse at 50% 115%, rgb(60 198 214 / 0.28), transparent 60%)',
      'linear-gradient(180deg, #0b3a52 0%, #061c2a 70%)',
    ].join(', '),
  },
  particles: 'sparkles',
  numeral: { ornament: { svg: lineBurst(gold, sea), placement: 'corner', size: 44 } },
  emblem: lineBurst(gold, sea, 12, 2.5),
  dayAccent: lineBurst(gold, sea, 10, 4),
  decorations: [
    { svg: bunting([gold, sea, pale, sea], 'flag', gold), anchor: 'top', size: 40, mobileSize: 28 },
    {
      svg: lineBurst(gold, sea),
      anchor: 'top-left',
      size: 110,
      x: 60,
      y: 80,
      motion: 'burst',
      mobileSize: null, // phones: no room clear of the version chip
    },
    {
      svg: lineBurst(sea, gold),
      anchor: 'top-right',
      size: 90,
      x: 110,
      y: 120,
      motion: 'burst',
      delay: 2.3,
      mobileSize: null, // phones: no room clear of the countdown and cards
    },
    {
      svg: lineBurst(pale, gold, 10),
      anchor: 'top-left',
      size: 60,
      x: 240,
      y: 210,
      motion: 'burst',
      delay: 4.4,
      mobileSize: null,
    },
    {
      svg: lineBurst(gold, pale, 12),
      anchor: 'top-right',
      size: 56,
      x: 280,
      y: 300,
      motion: 'burst',
      delay: 5.6,
      mobileSize: null,
    },
    {
      svg: sparkle(gold),
      anchor: 'top-right',
      size: 26,
      x: 270,
      y: 80,
      motion: 'pulse',
      mobileSize: null,
    },
    {
      svg: sparkle(sea),
      anchor: 'top-left',
      size: 22,
      x: 200,
      y: 120,
      motion: 'pulse',
      mobileSize: null,
    },
  ],
};
