import { lineBurst } from '../art/launch';
import { sparkle } from '../art/shared';
import type { ThemeDefinition } from '../types';

const blue = '#5ec8d8';
const gold = '#e6c06a';

/**
 * WoW: Forever's launch day: the cozy inn (brown base, parchment) with Forever's sea blue, and a
 * few thin fireworks that open and fade in the top corners. Still under reduced motion.
 */
export const theme: ThemeDefinition = {
  id: 'forever-launch',
  label: 'Forever launch',
  tokens: {
    '--color-bg': '#1a110b',
    '--color-surface': '#efe0bf',
    '--color-ink': '#2b1a0e',
    '--color-ink-muted': '#5c4330',
    '--color-ink-on-dark': '#f6ead0',
    '--color-ink-on-dark-muted': '#c9b48f',
    '--color-accent': blue,
    '--color-gold': gold,
    '--color-frame': '#2a1b10',
    '--glow': '0 0 14px rgb(94 200 216 / 0.5)',
    '--cell-tint': 'rgb(94 200 216 / 0.16)',
    '--particle-color': '#bfefff',
  },
  background: {
    css: [
      'radial-gradient(ellipse at 50% 0%, rgb(94 200 216 / 0.16), transparent 55%)',
      'radial-gradient(ellipse at 50% 15%, rgb(232 130 58 / 0.14), transparent 60%)',
      'radial-gradient(ellipse at 50% 120%, rgb(0 0 0 / 0.6), transparent 70%)',
      'var(--color-bg)',
    ].join(', '),
  },
  particles: 'sparkles',
  numeral: { ornament: { svg: lineBurst(gold, blue), placement: 'corner', size: 44 } },
  emblem: lineBurst(blue, gold, 12, 2.5),
  dayAccent: lineBurst(blue, gold, 10, 4),
  decorations: [
    {
      svg: lineBurst(blue, gold),
      anchor: 'top-left',
      size: 96,
      x: 70,
      y: 70,
      motion: 'burst',
      mobileSize: null, // phones: no room clear of the version chip
    },
    {
      svg: lineBurst(gold, blue),
      anchor: 'top-right',
      size: 76,
      x: 120,
      y: 130,
      motion: 'burst',
      delay: 2.4,
      mobileSize: null, // phones: no room clear of the countdown and cards
    },
    {
      svg: lineBurst('#bfefff', gold, 10),
      anchor: 'top-left',
      size: 54,
      x: 250,
      y: 190,
      motion: 'burst',
      delay: 4.6,
      mobileSize: null,
    },
    {
      svg: sparkle(blue),
      anchor: 'top-right',
      size: 26,
      x: 280,
      y: 70,
      motion: 'pulse',
      mobileSize: null,
    },
  ],
};
