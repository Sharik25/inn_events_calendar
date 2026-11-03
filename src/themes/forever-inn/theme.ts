import { hourglass } from '../art/forever';
import { sparkle } from '../art/shared';
import type { ThemeDefinition } from '../types';

/**
 * WoW: Forever's quiet day at the inn: the Anniversary inn's warm wood and parchment ("Inn at
 * dusk", see ../base) as the base, with Forever's sea blue as the accent: rims of the date frame,
 * chips and header buttons, the tankard icon, firelight halo, title glow, a cool light from above,
 * sparkles and the hourglass. Tune the blue here; brown stays the base.
 */
// Forever's sea blue (#5ec8d8), one step deeper so light text on event chips keeps WCAG AA.
const SEA_BLUE = '#54bccd';

export const theme: ThemeDefinition = {
  id: 'forever-inn',
  label: 'Forever inn',
  tokens: {
    // Brown base: the same wood, parchment and ink as the Anniversary inn.
    '--color-bg': '#1c120c',
    '--color-surface': '#efe0bf',
    '--color-ink': '#2b1a0e',
    '--color-ink-muted': '#5c4330',
    '--color-ink-on-dark': '#f3e3c3',
    '--color-ink-on-dark-muted': '#c9b48f',
    '--color-gold': '#d4a64a',
    '--color-frame': '#3a2516',
    // Forever accent.
    '--color-accent': SEA_BLUE,
    '--color-rim': SEA_BLUE,
    '--glow': '0 0 14px rgb(84 188 205 / 0.45)',
    '--title-glow': '0 0 24px rgb(84 188 205 / 0.55)',
    '--cell-tint': 'rgb(84 188 205 / 0.1)',
    '--particle-color': '#9fe3ee',
  },
  background: {
    css: [
      // A cool sea-blue light from above over the inn's warm ember glow.
      'radial-gradient(ellipse at 50% 0%, rgb(84 188 205 / 0.22), transparent 55%)',
      'radial-gradient(ellipse at 50% 22%, rgb(232 130 58 / 0.14), transparent 60%)',
      'radial-gradient(ellipse at 50% 120%, rgb(0 0 0 / 0.6), transparent 70%)',
      'var(--color-bg)',
    ].join(', '),
  },
  particles: 'sparkles',
  numeral: { ornament: { svg: hourglass, placement: 'corner', size: 44 } },
  emblem: hourglass,
  decorations: [
    {
      svg: sparkle(SEA_BLUE),
      anchor: 'top-right',
      size: 28,
      x: 160,
      y: 150,
      motion: 'pulse',
      mobileSize: null,
    },
  ],
};
